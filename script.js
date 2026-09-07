// ==============================
// SCRIPT.JS
// S10 PORTAL
// COMPLETE CORRECTED VERSION
// ==============================


// ==============================
// LOGIN + CONFIG + GLOBAL
// ==============================

const user = localStorage.getItem("user");
const loginDate = localStorage.getItem("loginDate");
const today = new Date().toLocaleDateString("en-CA");

if (!user || loginDate !== today) {
    localStorage.clear();
    window.location.replace("login.html");
}


const BASE_URL =
"https://script.google.com/macros/s/AKfycbxonOHaQLRfW_5Uw0yjQFxp0r2AB1ElqyycwsvqeS5FRZ1KrNqaGjhqFqhqlvqz864/exec";


let employees = [];
let filteredEmployees = [];
let allData = [];
let Report = [];
let allLinks = [];

let dataReady = false;
let firstLoad = true;

let mistakeOverviewChart = null;


// ==============================
// DATE PARSER
// ==============================

function parseDate(value) {

    if (!value) return null;

    if (value instanceof Date) {
        return isNaN(value.getTime()) ? null : value;
    }

    if (typeof value === "number") {

        const date = new Date(
            Math.round(
                (value - 25569) *
                86400 *
                1000
            )
        );

        return isNaN(date.getTime())
            ? null
            : date;
    }

    if (
        typeof value === "string" &&
        value.includes("/")
    ) {

        const parts = value.split("/");

        if (parts.length === 3) {

            const first = Number(parts[0]);
            const second = Number(parts[1]);
            const year = Number(parts[2]);

            /*
             * Handles:
             * MM/DD/YYYY
             * DD/MM/YYYY
             */

            if (first > 12) {

                const date =
                    new Date(
                        year,
                        second - 1,
                        first
                    );

                return isNaN(date.getTime())
                    ? null
                    : date;
            }

            const date =
                new Date(
                    year,
                    first - 1,
                    second
                );

            return isNaN(date.getTime())
                ? null
                : date;
        }
    }

    const d = new Date(value);

    return isNaN(d.getTime())
        ? null
        : d;
}


// ==============================
// WAIT FOR DATA
// ==============================

function waitForDataAndRender(name) {

    if (!dataReady) {

        setTimeout(() => {

            waitForDataAndRender(name);

        }, 300);

        return;
    }

    renderMistakes(name);
}


// ==============================
// DATE + TIME
// ==============================

function showDateTime() {

    const now = new Date();

    const time =
        now.getHours().toString().padStart(2, "0") +
        ":" +
        now.getMinutes().toString().padStart(2, "0") +
        ":" +
        now.getSeconds().toString().padStart(2, "0");

    const date =
        now.getDate().toString().padStart(2, "0") +
        "/" +
        (now.getMonth() + 1)
            .toString()
            .padStart(2, "0") +
        "/" +
        now.getFullYear();

    const timeBox =
        document.getElementById("currentTime");

    const dateBox =
        document.getElementById("currentDate");

    if (timeBox) {
        timeBox.innerHTML = time;
    }

    if (dateBox) {
        dateBox.innerHTML = date;
    }
}


setInterval(showDateTime, 1000);

showDateTime();


// ==============================
// LOAD DATA
// ==============================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadData();

    }
);


function loadData() {

    Promise.all([

        fetch(
            BASE_URL + "?type=employee"
        ).then(r => r.json()),

        fetch(
            BASE_URL + "?type=links"
        ).then(r => r.json()),

        fetch(
            BASE_URL + "?type=mistake"
        ).then(r => r.json()),

        fetch(
            BASE_URL + "?type=report"
        ).then(r => r.json())

    ])

    .then(
        ([
            employeeData,
            linksData,
            mistakeData,
            reportData
        ]) => {

            employees =
                employeeData || [];

            filteredEmployees =
                employeeData || [];

            allLinks =
                linksData || [];

            allData =
                Array.isArray(mistakeData)
                    ? mistakeData
                    : [];

            Report =
                Array.isArray(reportData)
                    ? reportData
                    : [];

            dataReady = true;


            // ==============================
            // REPORT MONTH FILTER
            // ==============================

            const monthFilter =
                document.getElementById(
                    "monthFilter"
                );

            if (
                monthFilter &&
                monthFilter.options.length <= 1
            ) {

                loadMonthFilter();

            }


            // ==============================
            // CS FILTERS
            // ==============================

            loadCSNameFilter();

            loadOverviewCSFilter();


            // ==============================
            // OVERVIEW YEAR + MONTH
            // ==============================

            loadOverviewYearFilter();

            loadOverviewMonthFilter();


            // ==============================
            // MISTAKE OVERVIEW
            // ==============================

            renderMistakeOverview();


            // ==============================
            // FIRST LOAD
            // ==============================

            if (firstLoad) {

                renderLinks(
                    "BO",
                    "boLinks"
                );

                renderLinks(
                    "Website Link",
                    "wbLinks"
                );

                renderLinks(
                    "Chat Link",
                    "ctLinks"
                );

                renderLinks(
                    "Deposit PLY",
                    "depositPlyLinks"
                );

                renderLinks(
                    "Deposit Sheet",
                    "depositSheetLinks"
                );

                renderLinks(
                    "SOP",
                    "sopLinks"
                );

                renderLinks(
                    "Sports BO",
                    "sportsBoLinks"
                );

                renderLinks(
                    "Sports",
                    "sportsGameLinks"
                );

                renderLinks(
                    "Other",
                    "otherLinks"
                );


                if (employees.length > 0) {

                    showEmployeeByObject(
                        employees[0]
                    );

                }

                firstLoad = false;
            }


            // ==============================
            // CURRENT EMPLOYEE MISTAKES
            // ==============================

            const empName =
                document.getElementById(
                    "empName"
                )?.innerText;

            if (
                empName &&
                empName !== "Select Employee"
            ) {

                renderMistakes(empName);

            }


            // ==============================
            // REPORT PAGE
            // ==============================

            const reportPage =
                document.getElementById(
                    "reportPage"
                );

            if (
                reportPage &&
                reportPage.style.display !== "none"
            ) {

                renderAllMistakes();

            }


            // ==============================
            // PERFORMANCE SUMMARY
            // ==============================

            renderMistakePerformanceSummary();

        }
    )

    .catch(error => {

        console.error(
            "Data Load Error:",
            error
        );

    });
}


// ==============================
// MANUAL REFRESH
// ==============================

function manualRefresh() {

    loadData();

}


// ==============================
// EMPLOYEE LIST
// ==============================

function renderEmployeeList(list) {

    const container =
        document.getElementById(
            "employeeList"
        );

    if (!container) return;

    container.innerHTML = "";

    list.forEach(emp => {

        const card =
            document.createElement("div");

        card.className = "employee";

        card.innerHTML = `
            <h4>
                ${emp["CS Name"] || "-"}
            </h4>

            <p>
                ${emp["STAFF Position"] || "-"}
            </p>
        `;

        card.onclick = () => {

            showEmployeeByObject(emp);

            const search =
                document.getElementById(
                    "search"
                );

            if (search) {

                search.value =
                    emp["CS Name"] || "";

            }

            container.innerHTML = "";

        };

        container.appendChild(card);

    });
}


// ==============================
// EMPLOYEE SEARCH
// ==============================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const searchBox =
            document.getElementById(
                "search"
            );

        if (searchBox) {

            searchBox.addEventListener(
                "keyup",
                function () {

                    const txt =
                        this.value
                            .trim()
                            .toLowerCase();

                    const list =
                        document.getElementById(
                            "employeeList"
                        );

                    if (!txt) {

                        if (list) {
                            list.innerHTML = "";
                        }

                        return;
                    }

                    const filtered =
                        employees.filter(
                            emp =>
                                String(
                                    emp["CS Name"] || ""
                                )
                                .toLowerCase()
                                .includes(txt)
                        );

                    renderEmployeeList(
                        filtered
                    );

                }
            );

        }

    }
);


// ==============================
// SHOW EMPLOYEE
// ==============================

function showEmployeeByObject(
    emp,
    showReport = true
) {

    if (!emp) return;


    const setText =
        (id, value) => {

            const el =
                document.getElementById(id);

            if (el) {

                el.innerText =
                    value || "-";

            }

        };


    setText(
        "empName",
        emp["CS Name"]
    );

    setText(
        "empPosition",
        emp["STAFF Position"]
    );

    setText(
        "psd",
        emp["PSD ID"]
    );

    setText(
        "office",
        emp["Office Location"] ||
        emp["Office Locaton"] ||
        "-"
    );

    setText(
        "teamid",
        emp["STAFF MS Team ID"]
    );

    setText(
        "agent",
        emp["ICX Agent"]
    );

    setText(
        "group",
        emp["Group"]
    );

    setText(
        "mistake",
        emp["Mistake"]
    );


    const search =
        document.getElementById(
            "search"
        );

    if (search) {

        search.value =
            emp["CS Name"] || "";

    }


    const list =
        document.getElementById(
            "employeeList"
        );

    if (list) {

        list.innerHTML = "";

    }


    const avatar =
        document.getElementById(
            "avatar"
        );

    if (avatar) {

        const name =
            String(
                emp["CS Name"] || ""
            ).trim();

        avatar.innerText =
            name
                ? name.charAt(0).toUpperCase()
                : "?";

    }


    // ==============================
    // BRANDS
    // ==============================

    setBrand(
        "superbo",
        emp["Super BO"]
    );

    setBrand(
        "dp",
        emp["DP"]
    );

    setBrand(
        "kv",
        emp["KV"]
    );

    setBrand(
        "hb",
        emp["HB"]
    );

    setBrand(
        "jb",
        emp["JB"]
    );

    setBrand(
        "jway",
        emp["JWAY"]
    );

    setBrand(
        "sb",
        emp["SB"]
    );

    setBrand(
        "slb",
        emp["SLB"]
    );

    setBrand(
        "bjdb",
        emp["BJDB"]
    );

    setBrand(
        "bn",
        emp["BN"]
    );

    setBrand(
        "bdvegas",
        emp["BDVegas"]
    );

    setBrand(
        "cpc88",
        emp["CPC88"]
    );

    setBrand(
        "deshi777",
        emp["Deshi777"]
    );


    if (showReport) {

        renderMistakes(
            emp["CS Name"]
        );

    }

}


// ==============================
// BRAND
// ==============================

function setBrand(id, value) {

    const box =
        document.getElementById(id);

    if (!box) return;

    const title =
        box.dataset?.title || "";

    if (
        value &&
        String(value).trim() !== ""
    ) {

        box.className =
            "brand-card active-brand";

        box.innerHTML = `
            <div class="brand-name">
                ${title}
            </div>

            <div class="brand-value">
                ${value}
            </div>
        `;

    } else {

        box.className =
            "brand-card inactive-brand";

        box.innerHTML = `
            <div class="brand-name">
                ${title}
            </div>

            <div class="brand-value">
                No Access
            </div>
        `;

    }

}


// ==============================
// PAGE SWITCH
// ==============================

function showPage(
    page,
    element
) {

    const pages = [

        "homePage",
        "employeePage",
        "reportPage",
        "linksPage",
        "WebsitePage",
        "depositPage",
        "SOPPage",
        "SportsPage",
        "OtherPage"

    ];


    pages.forEach(id => {

        const el =
            document.getElementById(id);

        if (el) {

            el.style.display = "none";

        }

    });


    document
        .querySelectorAll(".menu-item")
        .forEach(item => {

            item.classList.remove(
                "active"
            );

        });


    const target =
        document.getElementById(
            page + "Page"
        );

    if (target) {

        target.style.display = "block";

    }


    if (page === "report") {

        loadMonthFilter();

        renderAllMistakes();

    }


    if (element) {

        element.classList.add(
            "active"
        );

    }

}


// ==============================
// CURRENT MONTH
// ==============================

function getRunningMonth() {

    const now =
        new Date();

    return now.toLocaleString(
        "default",
        {
            month: "long",
            year: "numeric"
        }
    );

}


// ==============================
// CURRENT EMPLOYEE MISTAKES
// ==============================

function renderMistakes(csName) {

    const container =
        document.getElementById(
            "mistakeContainer"
        );

    if (!container) return;

    container.innerHTML = "";


    const cleanName =
        String(csName || "")
            .trim()
            .toLowerCase();


    if (!cleanName) {

        container.innerHTML = `
            <p class="no-data">
                No employee selected
            </p>
        `;

        return;
    }


    const runningMonth =
        getRunningMonth();


    container.innerHTML = `

        <div class="mistake-header">

            <div>
                <h2>
                    Showing mistakes for current month
                </h2>
            </div>

            <div class="month-badge">
                📅 ${runningMonth}
            </div>

        </div>

    `;


    const mistakes =
        Report.filter(item => {

            const itemName =
                String(
                    item["CS Name"] || ""
                )
                .trim()
                .toLowerCase();


            const date =
                parseDate(
                    item["Date"]
                );


            if (!date) return false;


            const itemMonth =
                date.toLocaleString(
                    "default",
                    {
                        month: "long",
                        year: "numeric"
                    }
                );


            return (
                itemName === cleanName &&
                itemMonth === runningMonth
            );

        });


    if (mistakes.length === 0) {

        container.innerHTML += `

            <p class="no-data">

                No mistakes found for
                ${runningMonth}

            </p>

        `;

        return;

    }


    const badgeColor = {

        "Wrong Information":
            "wrong-information",

        "Not Follow SOP":
            "not-follow-sop",

        "Late Reply":
            "late-reply",

        "No Reply":
            "no-reply",

        "Angry With Player":
            "angry-player",

        "Non Professional":
            "non-professional",

        "No solution":
            "no-solution",

        "No explanation":
            "no-explanation",

        "Verbal warning":
            "verbal-warning",

        "Warning letter":
            "warning-letter"

    };


    container.innerHTML +=

        mistakes.map(
            (item, index) => {

                const date =
                    parseDate(
                        item["Date"]
                    );


                const colorClass =
                    badgeColor[
                        item["Subject"]
                    ] || "default";


                return `

                    <div
                        class="
                            mistake-card
                            ${colorClass}
                        "
                    >

                        <div class="card-top">

                            <span
                                class="
                                    subject
                                    ${colorClass}
                                "
                            >
                                ${item["Subject"] || "-"}
                            </span>


                            <div
                                style="
                                    display:flex;
                                    align-items:center;
                                    gap:8px;
                                "
                            >

                                <span
                                    class="count-badge"
                                >
                                    ${mistakes.length}
                                </span>


                                <span
                                    class="count-badge"
                                >
                                    #${index + 1}
                                </span>


                                <span
                                    class="
                                        date
                                        ${colorClass}
                                    "
                                >
                                    📅 ${
                                        date
                                            ? date.toLocaleDateString(
                                                "en-GB"
                                            )
                                            : "-"
                                    }
                                </span>

                            </div>

                        </div>


                        <p class="remarks">

                            <strong>
                                REMARKS:
                            </strong>

                            <br>

                            ${
                                item["Detailed Remark"]
                                || "-"
                            }

                        </p>


                        <hr>


                        <p class="link">

                            🔗

                            ${
                                item[
                                    "Screenshot link"
                                ]

                                ?

                                `
                                    <a
                                        href="${
                                            item[
                                                "Screenshot link"
                                            ]
                                        }"
                                        target="_blank"
                                    >
                                        View Screenshot
                                    </a>
                                `

                                :

                                "No Screenshot"
                            }

                        </p>

                    </div>

                `;

            }
        ).join("");


    container.innerHTML += `

        <div class="end-list">

            <hr>

            <span>
                ⓘ End of list
            </span>

            <hr>

        </div>

    `;

}


// ==============================
// ALL MISTAKE REPORT
// ==============================

let mistakesPerPage = 10;

let currentMistakePage =
    Number(
        localStorage.getItem(
            "mistakePage"
        )
    ) || 1;

let allMistakeReports = [];


// ==============================
// MONTH FILTER
// ==============================

function loadMonthFilter() {

    const select =
        document.getElementById(
            "monthFilter"
        );

    if (!select) return;


    const currentValue =
        select.value;


    let months = [

        ...new Set(

            allData
                .map(item => {

                    const date =
                        parseDate(
                            item["Date"]
                        );

                    if (!date) return null;


                    return date.toLocaleString(
                        "en-GB",
                        {
                            month: "long",
                            year: "numeric"
                        }
                    );

                })
                .filter(Boolean)

        )

    ];


    months.sort(
        (a, b) =>
            new Date(b) -
            new Date(a)
    );


    select.innerHTML = `

        <option value="all">
            All Months 2026
        </option>

    `;


    months.forEach(month => {

        select.innerHTML += `

            <option value="${month}">
                ${month}
            </option>

        `;

    });


    if (currentValue) {

        select.value =
            currentValue;

    }

}


// ==============================
// CS NAME FILTER
// ==============================

function loadCSNameFilter() {

    const select =
        document.getElementById(
            "csNameFilter"
        );

    if (!select) return;


    const currentValue =
        select.value;


    const names = [

        ...new Set(

            allData
                .map(item =>
                    String(
                        item["CS Name"] || ""
                    ).trim()
                )
                .filter(
                    name => name !== ""
                )

        )

    ].sort(
        (a, b) =>
            a.localeCompare(b)
    );


    select.innerHTML = `

        <option value="all">
            All CS
        </option>

    `;


    names.forEach(name => {

        const option =
            document.createElement(
                "option"
            );

        option.value = name;

        option.textContent = name;

        select.appendChild(
            option
        );

    });


    if (
        currentValue &&
        names.includes(currentValue)
    ) {

        select.value =
            currentValue;

    }

}


// ==============================
// ALL MISTAKES
// ==============================

function renderAllMistakes(
    page = currentMistakePage
) {

    const container =
        document.getElementById(
            "reportMistakeContainer"
        );

    if (!container) return;


    let mistakes =
        [...allData];


    const selectedMonth =
        document.getElementById(
            "monthFilter"
        )?.value || "all";


    const selectedName =
        document.getElementById(
            "csNameFilter"
        )?.value || "all";


    if (
        selectedMonth !== "all"
    ) {

        mistakes =
            mistakes.filter(item => {

                const date =
                    parseDate(
                        item["Date"]
                    );

                if (!date) return false;


                const monthYear =
                    date.toLocaleString(
                        "en-GB",
                        {
                            month: "long",
                            year: "numeric"
                        }
                    );


                return (
                    monthYear ===
                    selectedMonth
                );

            });

    }


    if (
        selectedName !== "all"
    ) {

        mistakes =
            mistakes.filter(item => {

                return (
                    String(
                        item["CS Name"] || ""
                    )
                    .trim()
                    .toLowerCase()

                    ===

                    selectedName
                        .trim()
                        .toLowerCase()
                );

            });

    }


    const trueCount =
        mistakes.filter(item =>
            getMistakeCountedStatus(
                item
            )
        ).length;


    const notCounted =
        mistakes.length -
        trueCount;


    mistakes.sort((a, b) => {

        const dateA =
            parseDate(
                a["Date"]
            ) || new Date(0);

        const dateB =
            parseDate(
                b["Date"]
            ) || new Date(0);


        if (
            dateB - dateA !== 0
        ) {

            return (
                dateB - dateA
            );

        }


        return (
            Number(b.Row || 0) -
            Number(a.Row || 0)
        );

    });


    allMistakeReports =
        mistakes;


    const totalPages =
        Math.ceil(
            allMistakeReports.length /
            mistakesPerPage
        );


    if (totalPages === 0) {

        page = 1;

    } else {

        if (page < 1) {
            page = 1;
        }

        if (page > totalPages) {
            page = totalPages;
        }

    }


    currentMistakePage =
        page;


    localStorage.setItem(
        "mistakePage",
        currentMistakePage
    );


    const start =
        (
            currentMistakePage - 1
        ) * mistakesPerPage;


    const end =
        start +
        mistakesPerPage;


    mistakes =
        mistakes.slice(
            start,
            end
        );


    container.innerHTML = `

        <div class="mistake-header">

            <div>

                <h2>
                    All Mistakes Reports
                </h2>

            </div>


            <div
                style="
                    display:flex;
                    gap:10px;
                    align-items:center;
                "
            >

                <div class="count-badge">

                    📊
                    ${allMistakeReports.length}
                    Reports

                </div>


                <div
                    class="
                        count-badge
                        success
                    "
                >

                    🔴
                    ${trueCount}
                    Counted

                </div>


                <div
                    class="
                        count-badge
                        danger
                    "
                >

                    🟢
                    ${notCounted}
                    Not Counted

                </div>

            </div>

        </div>

    `;


    container.innerHTML +=
        renderMistakePagination();


    if (!mistakes.length) {

        container.innerHTML += `

            <p class="no-data">
                No reports found.
            </p>

        `;

        return;

    }


    const badgeColor = {

        "Wrong Information":
            "wrong-information",

        "Not Follow SOP":
            "not-follow-sop",

        "Late Reply":
            "late-reply",

        "No Reply":
            "no-reply",

        "Angry With Player":
            "angry-player",

        "Non Professional":
            "non-professional",

        "No solution":
            "no-solution",

        "No explanation":
            "no-explanation",

        "Verbal warning":
            "verbal-warning",

        "Warning letter":
            "warning-letter"

    };


    const html =
        mistakes.map(item => {

            const date =
                parseDate(
                    item["Date"]
                );


            const colorClass =
                badgeColor[
                    item["Subject"]
                ] || "default";


            const reported =
                String(
                    item[
                        "Reported in file"
                    ] || ""
                )
                .trim()
                .toUpperCase();


            const reportClass =
                reported === "TRUE"
                    ? "reported-true"
                    : "reported-false";


            return `

                <div
                    class="
                        mistake-card
                        ${colorClass}
                        ${reportClass}
                    "
                >

                    <p class="cs-name">

                        👤

                        <strong>
                            ${
                                item[
                                    "CS Name"
                                ] || "-"
                            }
                        </strong>

                    </p>


                    <div class="card-top">

                        <span
                            class="
                                subject
                                ${colorClass}
                            "
                        >
                            ${
                                item[
                                    "Subject"
                                ] || "-"
                            }
                        </span>


                        <span
                            class="
                                date
                                ${colorClass}
                            "
                        >

                            📅

                            ${
                                date
                                    ? date.toLocaleDateString(
                                        "en-GB"
                                    )
                                    : "-"
                            }

                        </span>

                    </div>


                    <p class="remarks">

                        <strong>
                            Mon REMARKS:
                        </strong>

                        <br>

                        ${
                            item[
                                "Detailed Remark"
                            ] || "-"
                        }

                    </p>


                    <hr>


                    <p class="remarks">

                        <strong>
                            Feedback from (TL/Senior):
                        </strong>

                        <br>

                        ${
                            item[
                                "Feedback from (TL/Senior)"
                            ] || "-"
                        }

                    </p>


                    <hr>


                    <div class="links">

                        ${
                            item["Chat link"]

                            ?

                            `
                                <a
                                    href="${
                                        item[
                                            "Chat link"
                                        ]
                                    }"
                                    target="_blank"
                                    class="chat-link"
                                >
                                    💬 View Chat
                                </a>
                            `

                            :

                            ""
                        }


                        ${
                            item[
                                "Screenshot link"
                            ]

                            ?

                            `
                                <a
                                    href="${
                                        item[
                                            "Screenshot link"
                                        ]
                                    }"
                                    target="_blank"
                                    class="ss-link"
                                >
                                    🖼 View Screenshot
                                </a>
                            `

                            :

                            ""
                        }


                        ${
                            !item["Chat link"] &&
                            !item["Screenshot link"]

                            ?

                            "No Attachment"

                            :

                            ""
                        }

                    </div>

                </div>

            `;

        }).join("");


    container.insertAdjacentHTML(
        "beforeend",
        html
    );


    container.insertAdjacentHTML(
        "beforeend",
        renderMistakePagination()
    );

}


// ==============================
// PAGINATION
// ==============================

function renderMistakePagination() {

    const totalPages =
        Math.ceil(
            allMistakeReports.length /
            mistakesPerPage
        );


    if (totalPages <= 1) {

        return "";

    }


    let html = `

        <div class="pagination">

            <button
                onclick="
                    renderAllMistakes(
                        ${currentMistakePage - 1}
                    )
                "
                ${
                    currentMistakePage === 1
                        ? "disabled"
                        : ""
                }
            >
                ⬅ Prev
            </button>

    `;


    const maxVisible = 7;


    let start =
        Math.max(
            1,
            currentMistakePage - 3
        );


    let end =
        Math.min(
            totalPages,
            currentMistakePage + 3
        );


    if (
        currentMistakePage <= 4
    ) {

        end =
            Math.min(
                totalPages,
                maxVisible
            );

    }


    if (
        currentMistakePage >=
        totalPages - 3
    ) {

        start =
            Math.max(
                1,
                totalPages -
                maxVisible +
                1
            );

    }


    if (start > 1) {

        html += `

            <button
                onclick="
                    renderAllMistakes(1)
                "
            >
                1
            </button>

        `;


        if (start > 2) {

            html += `
                <span class="dots">
                    ...
                </span>
            `;

        }

    }


    for (
        let i = start;
        i <= end;
        i++
    ) {

        html += `

            <button
                onclick="
                    renderAllMistakes(${i})
                "
                class="${
                    i === currentMistakePage
                        ? "active-page"
                        : ""
                }"
            >
                ${i}
            </button>

        `;

    }


    if (
        end < totalPages
    ) {

        if (
            end <
            totalPages - 1
        ) {

            html += `

                <span class="dots">
                    ...
                </span>

            `;

        }


        html += `

            <button
                onclick="
                    renderAllMistakes(
                        ${totalPages}
                    )
                "
            >
                ${totalPages}
            </button>

        `;

    }


    html += `

            <button
                onclick="
                    renderAllMistakes(
                        ${currentMistakePage + 1}
                    )
                "
                ${
                    currentMistakePage ===
                    totalPages
                        ? "disabled"
                        : ""
                }
            >
                Next ➡
            </button>

        </div>

    `;


    return html;

}


// ==============================
// LINKS
// ==============================

function renderLinks(
    category,
    containerId
) {

    const container =
        document.getElementById(
            containerId
        );

    if (!container) return;


    container.innerHTML = "";


    allLinks

        .filter(item => {

            return (

                item.Category ===
                category &&

                String(
                    item.Active
                ).toUpperCase() ===
                "TRUE"

            );

        })

        .forEach(item => {

            container.innerHTML += `

                <div
                    class="
                        link-card
                        ${item.Color || ""}
                    "
                >

                    <a
                        href="${item.URL}"
                        target="_blank"
                    >
                        ${
                            item.Name ||
                            "-"
                        }
                    </a>

                </div>

            `;

        });

}


// ==============================
// LOGOUT
// ==============================

function logout() {

    const confirmLogout =
        confirm(
            "Are you sure you want to logout?"
        );


    if (confirmLogout) {

        localStorage.removeItem(
            "user"
        );

        localStorage.removeItem(
            "loginDate"
        );

        window.location.replace(
            "login.html"
        );

    }

}


// ==============================
// OPEN REPORT PAGE
// ==============================

function openReportPage() {

    const page =
        document.getElementById(
            "reportPage"
        );


    if (page) {

        page.style.display =
            "block";

        loadMonthFilter();

        renderAllMistakes();

    }

}


// ==============================
// REPORT FILTER EVENTS
// ==============================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const monthFilter =
            document.getElementById(
                "monthFilter"
            );


        if (monthFilter) {

            monthFilter.onchange =
                () => {

                    currentMistakePage =
                        1;

                    renderAllMistakes(1);

                };

        }


        const csNameFilter =
            document.getElementById(
                "csNameFilter"
            );


        if (csNameFilter) {

            csNameFilter.onchange =
                () => {

                    currentMistakePage =
                        1;

                    renderAllMistakes(1);

                };

        }

    }
);


// ==============================
// WINDOW LOAD
// ==============================

window.addEventListener(
    "load",
    () => {

        const reportPage =
            document.getElementById(
                "reportPage"
            );


        if (
            reportPage &&
            reportPage.style.display !== "none"
        ) {

            loadMonthFilter();

            renderAllMistakes();

        }

    }
);


// ============================================================
// HOME MISTAKE REPORT
// ============================================================

function renderHomeMistakeReports() {

    const container =
        document.getElementById(
            "homeMistakeSubjects"
        );


    const totalElement =
        document.getElementById(
            "homeMistakeTotal"
        );


    const monthElement =
        document.getElementById(
            "homeMistakeMonth"
        );


    if (!container) return;


    const now =
        new Date();


    const currentMonth =
        now.getMonth();


    const currentYear =
        now.getFullYear();


    const monthName =
        now.toLocaleString(
            "en-US",
            {
                month: "long",
                year: "numeric"
            }
        );


    if (monthElement) {

        monthElement.textContent =
            `📅 ${monthName}`;

    }


    const currentMonthMistakes =

        Array.isArray(allData)

            ?

            allData.filter(item => {

                const date =
                    parseDate(
                        item["Date"]
                    );


                if (!date) return false;


                return (

                    date.getMonth() ===
                    currentMonth &&

                    date.getFullYear() ===
                    currentYear

                );

            })

            :

            [];


    const totalCounted =
        currentMonthMistakes.filter(
            item =>
                getMistakeCountedStatus(
                    item
                )
        ).length;


    if (totalElement) {

        totalElement.textContent =
            totalCounted;

    }


    const subjectCounts = {};


    currentMonthMistakes.forEach(
        item => {

            const subject =
                String(
                    item["Subject"] ||
                    "Other"
                ).trim();


            if (!subject) return;


            if (
                !subjectCounts[
                    subject
                ]
            ) {

                subjectCounts[
                    subject
                ] = {

                    total: 0,
                    counted: 0,
                    notCounted: 0

                };

            }


            subjectCounts[
                subject
            ].total++;


            const reported =
                String(
                    item[
                        "Reported in file"
                    ] || ""
                )
                .trim()
                .toUpperCase();


            if (
                reported === "TRUE"
            ) {

                subjectCounts[
                    subject
                ].counted++;

            } else {

                subjectCounts[
                    subject
                ].notCounted++;

            }

        }
    );


    const subjects =
        Object.entries(
            subjectCounts
        );


    if (!subjects.length) {

        container.innerHTML = `

            <div
                class="
                    home-mistake-empty
                "
            >

                <i
                    class="
                        fa-solid
                        fa-circle-check
                    "
                ></i>


                <h3>
                    No mistakes found
                </h3>


                <p>

                    No mistake reports for

                    <strong>
                        ${monthName}
                    </strong>

                </p>

            </div>

        `;

        return;

    }


    subjects.sort(
        (a, b) =>
            b[1].total -
            a[1].total
    );


    const subjectClass = {

        "Wrong Information":
            "wrong-information",

        "Not Follow SOP":
            "not-follow-sop",

        "Late Reply":
            "late-reply",

        "No Reply":
            "no-reply",

        "Angry With Player":
            "angry-player",

        "Non Professional":
            "non-professional",

        "No solution":
            "no-solution",

        "No explanation":
            "no-explanation",

        "Verbal warning":
            "verbal-warning",

        "Warning letter":
            "warning-letter"

    };


    container.innerHTML =

        subjects.map(
            ([subject, data]) => {

                const colorClass =
                    subjectClass[
                        subject
                    ] || "default";


                return `

                    <div
                        class="
                            home-mistake-card
                            ${colorClass}
                        "
                    >

                        <div
                            class="
                                home-mistake-card-top
                            "
                        >

                            <div
                                class="
                                    home-mistake-icon
                                "
                            >

                                <i
                                    class="
                                        fa-solid
                                        fa-triangle-exclamation
                                    "
                                ></i>

                            </div>


                            <div
                                class="
                                    home-mistake-count
                                "
                            >
                                ${data.total}
                            </div>

                        </div>


                        <div
                            class="
                                home-mistake-subject
                            "
                        >
                            ${subject}
                        </div>


                        <div
                            class="
                                home-mistake-label
                            "
                        >
                            Reports
                        </div>


                        <div
                            class="
                                home-mistake-status
                            "
                        >

                            <div
                                class="
                                    counted-box
                                "
                            >

                                <span>
                                    Counted
                                </span>

                                <strong>
                                    ${data.counted}
                                </strong>

                            </div>


                            <div
                                class="
                                    not-counted-box
                                "
                            >

                                <span>
                                    Not Counted
                                </span>

                                <strong>
                                    ${data.notCounted}
                                </strong>

                            </div>

                        </div>

                    </div>

                `;

            }
        ).join("");

}


// ============================================================
// HOME CLOCK
// ============================================================

function updateHomeClock() {

    const now =
        new Date();


    const timeElement =
        document.getElementById(
            "homeTime"
        );


    const dateElement =
        document.getElementById(
            "homeDate"
        );


    if (timeElement) {

        timeElement.textContent =
            now.toLocaleTimeString(
                "en-GB"
            );

    }


    if (dateElement) {

        dateElement.textContent =
            now.toLocaleDateString(
                "en-GB",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                }
            );

    }

}


updateHomeClock();

setInterval(
    updateHomeClock,
    1000
);


// ============================================================
// HOME STATS
// ============================================================

function updateHomeStats() {

    const totalCS =
        document.getElementById(
            "homeTotalCS"
        );


    if (
        totalCS &&
        typeof employees !==
            "undefined"
    ) {

        totalCS.textContent =
            Array.isArray(employees)
                ? employees.length
                : "-";

    }


    const mistakes =
        document.getElementById(
            "homeMistakes"
        );


    if (
        mistakes &&
        typeof allData !==
            "undefined"
    ) {

        const now =
            new Date();


        const currentMonth =
            now.getMonth();


        const currentYear =
            now.getFullYear();


        const currentMonthMistakes =

            Array.isArray(allData)

                ?

                allData.filter(item => {

                    const date =
                        typeof parseDate ===
                        "function"

                            ?

                            parseDate(
                                item["Date"]
                            )

                            :

                            null;


                    if (!date)
                        return false;


                    return (

                        date.getMonth() ===
                        currentMonth &&

                        date.getFullYear() ===
                        currentYear

                    );

                })

                :

                [];


        mistakes.textContent =
            currentMonthMistakes.length;

    }


    if (
        typeof allData !==
            "undefined" &&
        Array.isArray(allData)
    ) {

        if (
            typeof renderHomeMistakeReports ===
            "function"
        ) {

            renderHomeMistakeReports();

        }

    }

}


setTimeout(
    updateHomeStats,
    1500
);

setInterval(
    updateHomeStats,
    5000
);


// ============================================================
// MISTAKE PERFORMANCE SUMMARY
// ============================================================

const mistakeMonthNames = [

    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"

];


// ==============================
// SUMMARY DATE PARSER
// ==============================

function parseMistakeSummaryDate(
    value
) {

    if (!value) return null;


    if (value instanceof Date) {

        return isNaN(
            value.getTime()
        )

            ? null

            : value;

    }


    if (
        typeof value ===
        "number"
    ) {

        const date =
            new Date(
                Math.round(
                    (
                        value -
                        25569
                    ) *
                    86400 *
                    1000
                )
            );


        return isNaN(
            date.getTime()
        )

            ? null

            : date;

    }


    const text =
        String(value).trim();


    let match =
        text.match(
            /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/
        );


    if (match) {

        const first =
            Number(match[1]);

        const second =
            Number(match[2]);

        const year =
            Number(match[3]);


        if (first > 12) {

            const date =
                new Date(
                    year,
                    second - 1,
                    first
                );

            return isNaN(
                date.getTime()
            )

                ? null

                : date;

        }


        const date =
            new Date(
                year,
                first - 1,
                second
            );


        return isNaN(
            date.getTime()
        )

            ? null

            : date;

    }


    match =
        text.match(
            /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/
        );


    if (match) {

        const year =
            Number(match[1]);

        const month =
            Number(match[2]) - 1;

        const day =
            Number(match[3]);


        const date =
            new Date(
                year,
                month,
                day
            );


        return isNaN(
            date.getTime()
        )

            ? null

            : date;

    }


    const parsed =
        new Date(text);


    return isNaN(
        parsed.getTime()
    )

        ? null

        : parsed;

}


// ==============================
// SUBJECT
// ==============================

function getMistakeSubject(item) {

    if (!item) {
        return "Unknown";
    }


    return String(

        item.Subject ||

        item.subject ||

        item.Mistake ||

        item.mistake ||

        item["Mistake Type"] ||

        item["Subject"] ||

        "Unknown"

    ).trim();

}


// ==============================
// COUNTED STATUS
// ==============================

function getMistakeCountedStatus(
    item
) {

    if (!item) return false;


    const value =
        String(

            item[
                "Reported in file"
            ] ??

            item.Reported ??

            item.reported ??

            item.Counted ??

            item.counted ??

            item.Status ??

            item.status ??

            ""

        )
        .trim()
        .toLowerCase();


    return [

        "true",
        "yes",
        "counted",
        "reported",
        "1"

    ].includes(value);

}


// ==============================
// RATING
// ==============================

function getMistakeRating(
    count
) {

    if (count === 0) {

        return {

            text:
                "No Mistakes",

            icon:
                "fa-circle-check",

            className:
                "excellent"

        };

    }


    if (count <= 20) {

        return {

            text:
                "Very Good",

            icon:
                "fa-star",

            className:
                "very-good"

        };

    }


    if (count <= 40) {

        return {

            text:
                "Good",

            icon:
                "fa-thumbs-up",

            className:
                "good"

        };

    }


    if (count <= 60) {

        return {

            text:
                "Average",

            icon:
                "fa-face-meh",

            className:
                "average"

        };

    }


    if (count <= 80) {

        return {

            text:
                "Poor",

            icon:
                "fa-face-frown",

            className:
                "poor"

        };

    }


    return {

        text:
            "Very Poor",

        icon:
            "fa-triangle-exclamation",

        className:
            "very-poor"

    };

}


// ==============================
// SUMMARY DATA
// ==============================

function getMistakeSummaryData() {

    let data = [];


    if (
        Array.isArray(allData)
    ) {

        data =
            allData;

    }

    else if (
        Array.isArray(Report)
    ) {

        data =
            Report;

    }


    return data;

}


// ==============================
// PERFORMANCE SUMMARY
// ==============================

function renderMistakePerformanceSummary() {

    const grid =
        document.getElementById(
            "mistakeMonthlyGrid"
        );


    if (!grid) return;


    const yearFilter =
        document.getElementById(
            "mistakeYearFilter"
        );


    const monthFilter =
        document.getElementById(
            "mistakeMonthFilter"
        );


    const selectedYear =
        Number(
            yearFilter?.value ||
            2026
        );


    const selectedMonth =
        monthFilter?.value ??
        "all";


    const data =
        getMistakeSummaryData();


    const monthlyData =
        mistakeMonthNames.map(
            (
                month,
                index
            ) => ({

                month,

                monthIndex:
                    index,

                total: 0,

                counted: 0,

                notCounted: 0,

                subjects: {}

            })
        );


    data.forEach(item => {

        const date =
            parseDate(
                item.Date ??
                item.date ??
                item["Date"]
            );


        if (!date) return;


        if (
            date.getFullYear() !==
            selectedYear
        ) {

            return;

        }


        const month =
            date.getMonth();


        if (
            selectedMonth !==
            "all" &&

            month !==
            Number(selectedMonth)
        ) {

            return;

        }


        const monthData =
            monthlyData[month];


        monthData.total++;


        const isCounted =
            getMistakeCountedStatus(
                item
            );


        if (isCounted) {

            monthData.counted++;

        } else {

            monthData.notCounted++;

        }


        const subject =
            getMistakeSubject(
                item
            );


        monthData.subjects[
            subject
        ] =

            (
                monthData.subjects[
                    subject
                ] || 0
            ) + 1;

    });


    let displayMonths;


    if (
        selectedMonth ===
        "all"
    ) {

        displayMonths =
            monthlyData;

    }

    else {

        displayMonths = [

            monthlyData[
                Number(selectedMonth)
            ]

        ];

    }


    grid.innerHTML =

        displayMonths.map(
            month => {

                const rating =
                    getMistakeRating(
                        month.counted
                    );


                return `

                    <div
                        class="
                            month-performance-card
                            ${rating.className}
                            ${
                                month.total === 0
                                    ? "empty"
                                    : ""
                            }
                        "
                    >

                        <div
                            class="
                                month-performance-top
                            "
                        >

                            <span
                                class="month-name"
                            >
                                ${month.month}
                            </span>


                            <span
                                class="month-number"
                            >
                                ${
                                    String(
                                        month.monthIndex + 1
                                    ).padStart(
                                        2,
                                        "0"
                                    )
                                }
                            </span>

                        </div>


                        <div
                            class="
                                month-mistake-count
                            "
                        >
                            ${month.total}
                        </div>


                        <div
                            class="
                                month-mistake-label
                            "
                        >
                            Total Mistakes
                        </div>


                        <div
                            class="
                                month-status-row
                            "
                        >

                            <div
                                class="
                                    month-counted
                                "
                            >

                                <span>
                                    Counted
                                </span>

                                <strong>
                                    ${month.counted}
                                </strong>

                            </div>


                            <div
                                class="
                                    month-not-counted
                                "
                            >

                                <span>
                                    Not Counted
                                </span>

                                <strong>
                                    ${month.notCounted}
                                </strong>

                            </div>

                        </div>


                        <div
                            class="
                                month-rating
                            "
                        >

                            <i
                                class="
                                    fa-solid
                                    ${rating.icon}
                                "
                            ></i>

                            ${rating.text}

                        </div>

                    </div>

                `;

            }
        ).join("");


    updateMistakeSummaryStats(
        monthlyData,
        selectedMonth
    );


    const status =
        document.getElementById(
            "monthlySummaryStatus"
        );


    if (status) {

        status.textContent =

            selectedMonth === "all"

                ?

                `${selectedYear} • All Months`

                :

                `${mistakeMonthNames[
                    Number(selectedMonth)
                ]} ${selectedYear}`;

    }

}


// ==============================
// SUMMARY STATS
// ==============================

function updateMistakeSummaryStats(
    monthlyData,
    selectedMonth
) {

    let selectedData;


    if (
        selectedMonth ===
        "all"
    ) {

        selectedData = {

            total: 0,

            counted: 0,

            notCounted: 0,

            subjects: {}

        };


        monthlyData.forEach(
            month => {

                selectedData.total +=
                    month.total;

                selectedData.counted +=
                    month.counted;

                selectedData.notCounted +=
                    month.notCounted;


                Object.entries(
                    month.subjects
                ).forEach(
                    (
                        [
                            subject,
                            count
                        ]
                    ) => {

                        selectedData.subjects[
                            subject
                        ] =

                            (
                                selectedData
                                    .subjects[
                                        subject
                                    ] || 0
                            ) + count;

                    }
                );

            }
        );

    }

    else {

        selectedData =
            monthlyData[
                Number(selectedMonth)
            ];

    }


    const total =
        document.getElementById(
            "summaryTotal"
        );


    const counted =
        document.getElementById(
            "summaryCounted"
        );


    const notCounted =
        document.getElementById(
            "summaryNotCounted"
        );


    if (total) {

        total.textContent =
            selectedData.total;

    }


    if (counted) {

        counted.textContent =
            selectedData.counted;

    }


    if (notCounted) {

        notCounted.textContent =
            selectedData.notCounted;

    }


    const rating =
        document.getElementById(
            "summaryRating"
        );


    if (rating) {

        const result =
            getMistakeRating(
                selectedData.counted
            );


        rating.textContent =
            result.text;

    }


    const activeMonths =
        monthlyData.filter(
            month =>
                month.total > 0
        );


    const worstMonth =
        document.getElementById(
            "worstMonth"
        );


    const bestMonth =
        document.getElementById(
            "bestMonth"
        );


    if (
        activeMonths.length
    ) {

        const worst =
            [...activeMonths].sort(
                (a, b) =>
                    b.total -
                    a.total
            )[0];


        const best =
            [...activeMonths].sort(
                (a, b) =>
                    a.total -
                    b.total
            )[0];


        if (worstMonth) {

            worstMonth.textContent =
                `${worst.month} (${worst.total})`;

        }


        if (bestMonth) {

            bestMonth.textContent =
                `${best.month} (${best.total})`;

        }

    }

    else {

        if (worstMonth) {

            worstMonth.textContent =
                "-";

        }


        if (bestMonth) {

            bestMonth.textContent =
                "-";

        }

    }


    const topMistake =
        document.getElementById(
            "topMistake"
        );


    const subjects =
        Object.entries(
            selectedData.subjects || {}
        );


    if (subjects.length) {

        subjects.sort(
            (a, b) =>
                b[1] -
                a[1]
        );


        if (topMistake) {

            topMistake.textContent =
                `${subjects[0][0]} (${subjects[0][1]})`;

        }

    }

    else {

        if (topMistake) {

            topMistake.textContent =
                "-";

        }

    }

}


// ==============================
// PERFORMANCE SUMMARY INIT
// ==============================

function initMistakePerformanceSummary() {

    const yearFilter =
        document.getElementById(
            "mistakeYearFilter"
        );


    const monthFilter =
        document.getElementById(
            "mistakeMonthFilter"
        );


    if (yearFilter) {

        yearFilter.onchange =
            renderMistakePerformanceSummary;

    }


    if (monthFilter) {

        monthFilter.onchange =
            renderMistakePerformanceSummary;

    }


    renderMistakePerformanceSummary();

}


document.addEventListener(
    "DOMContentLoaded",
    () => {

        initMistakePerformanceSummary();

    }
);


// ============================================================
// MISTAKE OVERVIEW
// ============================================================


// ==============================
// OVERVIEW CS FILTER
// ==============================

function loadOverviewCSFilter() {

    const select =
        document.getElementById(
            "overviewCSFilter"
        );


    if (!select) return;


    if (
        !Array.isArray(allData) ||
        allData.length === 0
    ) {

        return;

    }


    const currentValue =
        select.value ||
        "all";


    const names = [

        ...new Set(

            allData
                .map(item =>
                    String(
                        item["CS Name"] ||
                        ""
                    ).trim()
                )
                .filter(
                    name =>
                        name !== ""
                )

        )

    ].sort(
        (a, b) =>
            a.localeCompare(b)
    );


    select.innerHTML = `

        <option value="all">
            All CS
        </option>

    `;


    names.forEach(name => {

        const option =
            document.createElement(
                "option"
            );


        option.value =
            name;


        option.textContent =
            name;


        select.appendChild(
            option
        );

    });


    if (
        currentValue !== "all" &&
        names.includes(
            currentValue
        )
    ) {

        select.value =
            currentValue;

    }

}


// ============================================================
// IMPORTANT NEW YEAR / SECTION FILTER
// ============================================================


// ==============================
// OVERVIEW YEAR FILTER
// ==============================

function loadOverviewYearFilter() {

    const select =
        document.getElementById(
            "overviewYearFilter"
        );


    if (!select) return;


    const currentValue =
        select.value ||
        "2026-full";


    select.innerHTML = `

        <option value="2026-full">
            2026 Full Year
        </option>

        <option value="2026-1st">
            2026 1st Section
        </option>

        <option value="2026-2nd">
            2026 2nd Section
        </option>

    `;


    if (

        currentValue ===
            "2026-full" ||

        currentValue ===
            "2026-1st" ||

        currentValue ===
            "2026-2nd"

    ) {

        select.value =
            currentValue;

    }

    else {

        select.value =
            "2026-full";

    }

}


// ==============================
// GET SELECTED YEAR SECTION
// ==============================

function getOverviewYearSection() {

    const value =
        document.getElementById(
            "overviewYearFilter"
        )?.value ||
        "2026-full";


    // ==============================
    // 1ST SECTION
    // January - June
    // ==============================

    if (
        value ===
        "2026-1st"
    ) {

        return {

            value,

            year: 2026,

            startMonth: 0,

            endMonth: 5,

            label:
                "2026 1st Section"

        };

    }


    // ==============================
    // 2ND SECTION
    // July - December
    // ==============================

    if (
        value ===
        "2026-2nd"
    ) {

        return {

            value,

            year: 2026,

            startMonth: 6,

            endMonth: 11,

            label:
                "2026 2nd Section"

        };

    }


    // ==============================
    // FULL YEAR
    // January - December
    // ==============================

    return {

        value:
            "2026-full",

        year: 2026,

        startMonth: 0,

        endMonth: 11,

        label:
            "2026 Full Year"

    };

}


// ==============================
// OVERVIEW MONTH FILTER
// ==============================

function loadOverviewMonthFilter() {

    const select =
        document.getElementById(
            "overviewMonthFilter"
        );


    if (!select) return;


    const section =
        getOverviewYearSection();


    const currentValue =
        select.value ||
        "all";


    select.innerHTML = `

        <option value="all">
            All Months
        </option>

    `;


    for (

        let i =
            section.startMonth;

        i <=
            section.endMonth;

        i++

    ) {

        const option =
            document.createElement(
                "option"
            );


        option.value =
            String(i);


        option.textContent =
            mistakeMonthNames[i];


        select.appendChild(
            option
        );

    }


    const currentNumber =
        Number(currentValue);


    if (

        currentValue !==
            "all" &&

        Number.isInteger(
            currentNumber
        ) &&

        currentNumber >=
            section.startMonth &&

        currentNumber <=
            section.endMonth

    ) {

        select.value =
            currentValue;

    }

    else {

        select.value =
            "all";

    }

}


// ==============================
// GET OVERVIEW MISTAKES
// ==============================

function getOverviewMistakes() {

    if (
        !Array.isArray(allData)
    ) {

        return [];

    }


    const csFilter =
        document.getElementById(
            "overviewCSFilter"
        )?.value ||
        "all";


    const monthFilter =
        document.getElementById(
            "overviewMonthFilter"
        )?.value ||
        "all";


    const section =
        getOverviewYearSection();


    return allData.filter(
        item => {

            const date =
                parseMistakeSummaryDate(
                    item["Date"]
                );


            if (!date) {

                return false;

            }


            // ==============================
            // YEAR
            // ==============================

            if (
                date.getFullYear() !==
                section.year
            ) {

                return false;

            }


            // ==============================
            // SECTION
            // ==============================

            if (

                date.getMonth() <
                    section.startMonth ||

                date.getMonth() >
                    section.endMonth

            ) {

                return false;

            }


            // ==============================
            // MONTH
            // ==============================

            if (
                monthFilter !==
                "all"
            ) {

                if (
                    date.getMonth() !==
                    Number(
                        monthFilter
                    )
                ) {

                    return false;

                }

            }


            // ==============================
            // CS
            // ==============================

            if (
                csFilter !==
                "all"
            ) {

                const itemCS =
                    String(
                        item[
                            "CS Name"
                        ] || ""
                    )
                    .trim()
                    .toLowerCase();


                if (
                    itemCS !==
                    csFilter
                        .trim()
                        .toLowerCase()
                ) {

                    return false;

                }

            }


            return true;

        }
    );

}


// ==============================
// RENDER OVERVIEW
// ==============================

function renderMistakeOverview() {

    const data =
        getOverviewMistakes();


    const total =
        data.length;


    const counted =
        data.filter(
            item =>
                getMistakeCountedStatus(
                    item
                )
        ).length;


    const notCounted =
        total -
        counted;


    const totalElement =
        document.getElementById(
            "overviewTotal"
        );


    const countedElement =
        document.getElementById(
            "overviewCounted"
        );


    const notCountedElement =
        document.getElementById(
            "overviewNotCounted"
        );


    const ratingElement =
        document.getElementById(
            "overviewRating"
        );


    if (totalElement) {

        totalElement.textContent =
            total;

    }


    if (countedElement) {

        countedElement.textContent =
            counted;

    }


    if (notCountedElement) {

        notCountedElement.textContent =
            notCounted;

    }


    if (ratingElement) {

        ratingElement.textContent =
            getMistakeRating(
                counted
            ).text;

    }


    const status =
        document.getElementById(
            "overviewChartStatus"
        );


    const cs =
        document.getElementById(
            "overviewCSFilter"
        )?.value ||
        "all";


    const month =
        document.getElementById(
            "overviewMonthFilter"
        )?.value ||
        "all";


    const section =
        getOverviewYearSection();


    const monthText =

        month === "all"

            ?

            "All Months"

            :

            mistakeMonthNames[
                Number(month)
            ];


    if (status) {

        status.textContent =

            `${
                cs === "all"
                    ? "All CS"
                    : cs
            } • ${
                section.label
            } • ${
                monthText
            }`;

    }


    // ==============================
    // CHART
    // ==============================

    renderMistakeOverviewChart(
        data,
        cs,
        month
    );


    // ==============================
    // SUBJECT BREAKDOWN
    // ==============================

    renderMistakeSubjectBreakdown(
        data
    );

}


// ==============================
// OVERVIEW CHART
// ==============================

function renderMistakeOverviewChart(
    data,
    selectedCS,
    selectedMonth
) {

    const canvas =
        document.getElementById(
            "mistakeOverviewChart"
        );


    if (!canvas) return;


    const ctx =
        canvas.getContext(
            "2d"
        );


    if (
        mistakeOverviewChart
    ) {

        mistakeOverviewChart.destroy();

        mistakeOverviewChart =
            null;

    }


    let labels = [];

    let totalData = [];

    let countedData = [];

    let notCountedData = [];


    // ========================================================
    // SELECTED CS
    // ========================================================

    if (
        selectedCS !==
        "all"
    ) {


        // ====================================================
        // SELECTED CS + ALL MONTHS
        // ====================================================

        if (
            selectedMonth ===
            "all"
        ) {

            const section =
                getOverviewYearSection();


            const overviewMonths =
                mistakeMonthNames.slice(
                    section.startMonth,
                    section.endMonth + 1
                );


            labels =
                overviewMonths;


            totalData =
                overviewMonths.map(
                    (
                        _,
                        index
                    ) => {

                        const monthIndex =
                            section.startMonth +
                            index;


                        return data.filter(
                            item => {

                                const date =
                                    parseMistakeSummaryDate(
                                        item["Date"]
                                    );


                                return (

                                    date &&

                                    date.getMonth() ===
                                    monthIndex

                                );

                            }
                        ).length;

                    }
                );


            countedData =
                overviewMonths.map(
                    (
                        _,
                        index
                    ) => {

                        const monthIndex =
                            section.startMonth +
                            index;


                        return data.filter(
                            item => {

                                const date =
                                    parseMistakeSummaryDate(
                                        item["Date"]
                                    );


                                return (

                                    date &&

                                    date.getMonth() ===
                                    monthIndex &&

                                    getMistakeCountedStatus(
                                        item
                                    )

                                );

                            }
                        ).length;

                    }
                );


            notCountedData =
                totalData.map(
                    (
                        value,
                        index
                    ) =>

                        value -
                        countedData[index]

                );

        }


        // ====================================================
        // SELECTED CS + SELECTED MONTH
        // ====================================================

        else {

            const subjects = {};


            data.forEach(
                item => {

                    const subject =
                        getMistakeSubject(
                            item
                        );


                    subjects[
                        subject
                    ] =

                        (
                            subjects[
                                subject
                            ] || 0
                        ) + 1;

                }
            );


            const sorted =
                Object.entries(
                    subjects
                ).sort(
                    (a, b) =>
                        b[1] -
                        a[1]
                );


            labels =
                sorted.map(
                    item =>
                        item[0]
                );


            totalData =
                sorted.map(
                    item =>
                        item[1]
                );


            countedData =
                labels.map(
                    subject =>

                        data.filter(
                            item =>

                                getMistakeSubject(
                                    item
                                ) ===
                                subject &&

                                getMistakeCountedStatus(
                                    item
                                )
                        ).length

                );


            notCountedData =
                totalData.map(
                    (
                        value,
                        index
                    ) =>

                        value -
                        countedData[index]

                );

        }

    }


    // ========================================================
    // ALL CS
    // ========================================================

    else {


        // ====================================================
        // ALL CS + ALL MONTHS
        // ====================================================

        if (
            selectedMonth ===
            "all"
        ) {

            const csData = {};


            data.forEach(
                item => {

                    const name =
                        String(
                            item[
                                "CS Name"
                            ] ||
                            "Unknown"
                        ).trim();


                    if (
                        !csData[name]
                    ) {

                        csData[name] = {

                            total: 0,

                            counted: 0,

                            notCounted: 0

                        };

                    }


                    csData[
                        name
                    ].total++;


                    if (
                        getMistakeCountedStatus(
                            item
                        )
                    ) {

                        csData[
                            name
                        ].counted++;

                    }

                    else {

                        csData[
                            name
                        ].notCounted++;

                    }

                }
            );


            const sorted =
                Object.entries(
                    csData
                ).sort(
                    (a, b) =>
                        b[1].total -
                        a[1].total
                );


            labels =
                sorted.map(
                    item =>
                        item[0]
                );


            totalData =
                sorted.map(
                    item =>
                        item[1].total
                );


            countedData =
                sorted.map(
                    item =>
                        item[1].counted
                );


            notCountedData =
                sorted.map(
                    item =>
                        item[1].notCounted
                );

        }


        // ====================================================
        // ALL CS + SELECTED MONTH
        // ====================================================

        else {

            const subjects = {};


            data.forEach(
                item => {

                    const subject =
                        getMistakeSubject(
                            item
                        );


                    subjects[
                        subject
                    ] =

                        (
                            subjects[
                                subject
                            ] || 0
                        ) + 1;

                }
            );


            const sorted =
                Object.entries(
                    subjects
                ).sort(
                    (a, b) =>
                        b[1] -
                        a[1]
                );


            labels =
                sorted.map(
                    item =>
                        item[0]
                );


            totalData =
                sorted.map(
                    item =>
                        item[1]
                );


            countedData =
                labels.map(
                    subject =>

                        data.filter(
                            item =>

                                getMistakeSubject(
                                    item
                                ) ===
                                subject &&

                                getMistakeCountedStatus(
                                    item
                                )
                        ).length

                );


            notCountedData =
                totalData.map(
                    (
                        value,
                        index
                    ) =>

                        value -
                        countedData[index]

                );

        }

    }


    // ==============================
    // CHART.JS CHECK
    // ==============================

    if (
        typeof Chart ===
        "undefined"
    ) {

        console.error(
            "Chart.js is not loaded."
        );

        return;

    }


    // ==============================
    // CREATE CHART
    // ==============================

    mistakeOverviewChart =

        new Chart(
            ctx,
            {

                type: "bar",


                data: {

                    labels: labels,


                    datasets: [

                        {

                            label:
                                "Total",

                            data:
                                totalData,

                            borderWidth:
                                1

                        },


                        {

                            label:
                                "Counted",

                            data:
                                countedData,

                            borderWidth:
                                1

                        },


                        {

                            label:
                                "Not Counted",

                            data:
                                notCountedData,

                            borderWidth:
                                1

                        }

                    ]

                },


                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false,


                    interaction: {

                        mode:
                            "index",

                        intersect:
                            false

                    },


                    plugins: {

                        legend: {

                            display:
                                true

                        }

                    },


                    scales: {

                        y: {

                            beginAtZero:
                                true,

                            ticks: {

                                precision:
                                    0

                            }

                        }

                    }

                }

            }

        );

}


// ==============================
// OVERVIEW INIT
// ==============================

function initMistakeOverview() {

    loadOverviewCSFilter();

    loadOverviewYearFilter();

    loadOverviewMonthFilter();


    const csFilter =
        document.getElementById(
            "overviewCSFilter"
        );


    const yearFilter =
        document.getElementById(
            "overviewYearFilter"
        );


    const monthFilter =
        document.getElementById(
            "overviewMonthFilter"
        );


    // ==============================
    // CS CHANGE
    // ==============================

    if (csFilter) {

        csFilter.onchange =
            () => {

                renderMistakeOverview();

            };

    }


    // ==============================
    // YEAR / SECTION CHANGE
    // ==============================

    if (yearFilter) {

        yearFilter.onchange =
            () => {

                /*
                 * Important:
                 * When the section changes,
                 * the Month dropdown is rebuilt.
                 */

                loadOverviewMonthFilter();

                renderMistakeOverview();

            };

    }


    // ==============================
    // MONTH CHANGE
    // ==============================

    if (monthFilter) {

        monthFilter.onchange =
            () => {

                renderMistakeOverview();

            };

    }


    renderMistakeOverview();

}


// ==============================
// INIT OVERVIEW
// ==============================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        setTimeout(
            initMistakeOverview,
            1000
        );

    }
);


// ============================================================
// SUBJECT BREAKDOWN
// ============================================================

function renderMistakeSubjectBreakdown(
    data
) {

    const container =
        document.getElementById(
            "mistakeSubjectBreakdown"
        );


    if (!container) return;


    if (
        !Array.isArray(data) ||
        !data.length
    ) {

        container.innerHTML = `

            <div
                class="
                    subject-breakdown-empty
                "
            >
                No mistake data available
            </div>

        `;

        return;

    }


    const subjects = {};


    data.forEach(
        item => {

            const subject =
                getMistakeSubject(
                    item
                );


            if (
                !subjects[subject]
            ) {

                subjects[
                    subject
                ] = {

                    total: 0,

                    counted: 0,

                    notCounted: 0

                };

            }


            subjects[
                subject
            ].total++;


            if (
                getMistakeCountedStatus(
                    item
                )
            ) {

                subjects[
                    subject
                ].counted++;

            }

            else {

                subjects[
                    subject
                ].notCounted++;

            }

        }
    );


    const sorted =
        Object.entries(
            subjects
        ).sort(
            (a, b) =>
                b[1].total -
                a[1].total
        );


    container.innerHTML =

        sorted.map(
            (
                [
                    subject,
                    value
                ]
            ) => {

                const percentage =

                    value.total > 0

                        ?

                        Math.round(
                            (
                                value.counted /
                                value.total
                            ) *
                            100
                        )

                        :

                        0;


                return `

                    <div
                        class="
                            subject-breakdown-card
                        "
                    >


                        <div
                            class="
                                subject-breakdown-top
                            "
                        >


                            <div
                                class="
                                    subject-breakdown-name
                                "
                            >

                                <i
                                    class="
                                        fa-solid
                                        fa-triangle-exclamation
                                    "
                                ></i>


                                <span>
                                    ${subject}
                                </span>

                            </div>


                            <strong>
                                ${value.total}
                            </strong>


                        </div>


                        <div
                            class="
                                subject-breakdown-bar
                            "
                        >

                            <div
                                class="
                                    subject-breakdown-progress
                                "
                                style="
                                    width:${percentage}%;
                                "
                            ></div>

                        </div>


                        <div
                            class="
                                subject-breakdown-status
                            "
                        >

                            <span>

                                Counted:

                                <strong>
                                    ${value.counted}
                                </strong>

                            </span>


                            <span>

                                Not Counted:

                                <strong>
                                    ${value.notCounted}
                                </strong>

                            </span>

                        </div>


                    </div>

                `;

            }
        ).join("");

}
