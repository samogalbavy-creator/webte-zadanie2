async function loadEatAndMeet() {
    try {
        const response = await fetch("data/eatandmeet.html");

        if (!response.ok) {
            throw new Error("Nepodarilo sa načítať súbor Eat & Meet.");
        }

        const html = await response.text();

        const parser = new DOMParser();

        const documentHTML = parser.parseFromString(
            html,
            "text/html"
        );

        const meals = documentHTML.querySelectorAll(
            ".menu-details"
        );

        const menu = [];

        meals.forEach(function (meal) {
            const dayElement = meal.closest('[id^="day-"]');

            if (!dayElement) {
                return;
            }

            const day = Number(
                dayElement.id.replace("day-", "")
            );

            if (![1, 2, 3, 4, 5].includes(day)) {
                return;
            }

            const typeElement = meal.querySelector(".menu-title h4");
            const nameElement = meal.querySelector(".menu-description .desc");
            const priceElement = meal.querySelector(".price");

            if (!typeElement || !nameElement || !priceElement) {
                return;
            }

            const type = typeElement.textContent.trim();
            const name = nameElement.textContent.trim();

            const priceText = priceElement.textContent
                .replace(/\s+/g, " ")
                .trim();

            menu.push({
                restaurant: "Eat & Meet",
                day: day,
                type: type,
                name: name,
                priceText: priceText
            });
        });

        console.table(menu);
        return menu;

    } catch (error) {
        console.error("Chyba pri načítaní:", error);
        return[];
    }
}

function renderMenu(menu, selectedDay) {
    const container = document.getElementById("menu-container");

    container.replaceChildren();

    const dayNames = [
        "Pondelok",
        "Utorok",
        "Streda",
        "Štvrtok",
        "Piatok"
    ];

    const daysToShow = selectedDay === "all"
        ? [1, 2, 3, 4, 5]
        : [selectedDay];

    const dayButtons = document.querySelectorAll("button[data-day]");

    dayButtons.forEach(function (button) {
        const isSelected = button.dataset.day === String(selectedDay);

        button.setAttribute("aria-pressed", String(isSelected));
    });

    const restaurants = [
        {
            name: "Eat & Meet",
            url: "https://eatandmeet.sk/"
        },
        {
            name: "DRAG",
            url: "https://www.restauracia-drag.sk/denne-menu"
        }
    ];

    restaurants.forEach(function (restaurant) {
        const card = document.createElement("article");
        card.className = "restaurant-card";

        const heading = document.createElement("h3");
        heading.textContent = restaurant.name;

        const sourceLink = document.createElement("a");
        sourceLink.href = restaurant.url;
        sourceLink.textContent = "Pôvodná stránka reštaurácie";

        card.append(heading, sourceLink);

        daysToShow.forEach(function (day) {
            const dayHeading = document.createElement("h4");
            dayHeading.textContent = dayNames[day - 1];

            card.append(dayHeading);

            const filteredMenu = menu.filter(function (meal) {
                return meal.restaurant === restaurant.name &&
                    meal.day === day;
            });

            if (filteredMenu.length === 0) {
                const message = document.createElement("p");
                message.textContent =
                    "Menu na tento deň nie je k dispozícii.";

                card.append(message);
                return;
            }

            filteredMenu.forEach(function (meal) {
                const item = document.createElement("div");
                item.className = "meal";

                const type = document.createElement("p");
                type.className = "meal__type";
                type.textContent = meal.type;

                const name = document.createElement("p");
                name.textContent = meal.name;

                const price = document.createElement("strong");
                price.textContent = meal.priceText;

                item.append(type, name, price);
                card.append(item);
            });
        });

        container.append(card);
    });
}

async function loadDrag() {
    try {
        const response = await fetch("data/drag.html");

        if (!response.ok) {
            throw new Error("Nepodarilo sa načítať súbor DRAG.");
        }

        const html = await response.text();

        const parser = new DOMParser();
        const documentHTML = parser.parseFromString(html, "text/html");

        const dayIds = [
            "pondelok",
            "utorok",
            "streda",
            "stvrtok",
            "piatok"
        ];

        const menu = [];

        dayIds.forEach(function (dayId, index) {
            const dayElement = documentHTML.getElementById(dayId);

            if (!dayElement) {
                return;
            }

            const soupHeading = Array.from(
                dayElement.querySelectorAll("h3")
            ).find(function (heading) {
                return heading.textContent.trim().toUpperCase() === "POLIEVKA";
            });

            if (soupHeading) {
                const headingBlock = soupHeading.closest(".menu_box_title");

                if (headingBlock) {
                    let node = headingBlock.nextSibling;
                    let soupText = "";

                    while (node) {
                        if (
                            node.nodeType === Node.ELEMENT_NODE &&
                            node.matches(".menu_box_title")
                        ) {
                            break;
                        }

                        if (
                            node.nodeType === Node.TEXT_NODE ||
                            node.nodeType === Node.ELEMENT_NODE
                        ) {
                            soupText += " " + node.textContent;
                        }

                        node = node.nextSibling;
                    }

                    const soupName = soupText.replace(/\s+/g, " ").trim();

                    if (soupName) {
                        menu.push({
                            restaurant: "DRAG",
                            day: index + 1,
                            type: "Polievka",
                            name: soupName,
                            priceText: "Cena neuvedená"
                        });
                    }
                }
            }

            const rows = dayElement.querySelectorAll("table tr");

            rows.forEach(function (row) {
                const cells = row.querySelectorAll("td");

                if (cells.length < 2) {
                    return;
                }

                const name = cells[0].textContent
                    .replace(/\s+/g, " ")
                    .trim();

                const priceText = cells[1].textContent
                    .replace(/\s+/g, " ")
                    .trim();

                if (!name || !priceText) {
                    return;
                }

                menu.push({
                    restaurant: "DRAG",
                    day: index + 1,
                    type: "Hlavné jedlo",
                    name: name,
                    priceText: priceText
                });
            });
        });

        console.table(menu);
        return menu;

    } catch (error) {
        console.error("Chyba pri načítaní DRAG:", error);
        return [];
    }
}

async function initializeMenu() {
    const status = document.getElementById("status");
    status.textContent = "Načítavam menu…";

    const results = await Promise.all([
        loadEatAndMeet(),
        loadDrag()
    ]);

    const menu = results.flat();

    const today = new Date().getDay();
    const initialDay = today >= 1 && today <= 5 ? today : 1;

    renderMenu(menu, initialDay);

    if (results.some(function (items) {
        return items.length === 0;
    })) {
        status.textContent =
            "Menu niektorej reštaurácie sa nepodarilo získať.";
    } else {
        status.textContent = "";
    }

    const dayButtons = document.querySelectorAll("button[data-day]");

    dayButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            const value = button.dataset.day;

            const selectedDay = value === "all"
                ? "all"
                : Number(value);

            renderMenu(menu, selectedDay);
        });
    });
}

initializeMenu();