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
            url: "https://eatandmeet.sk/",
            storageKey: "menu-local-eatandmeet"
        },
        {
            name: "DRAG",
            url: "https://www.restauracia-drag.sk/denne-menu",
            storageKey: "menu-local-drag"
        },
        {
            name: "Machnáč",
            url: "https://machnac.sk/denneMenu.html",
            storageKey: "menu-local-machnac"
        }
    ];

    const selectedRestaurants = Array.from(
    document.querySelectorAll('input[name="restaurant"]:checked')
    ).map(function (checkbox) {
        return checkbox.value;
    });

    if (selectedRestaurants.length === 0) {
        container.textContent = "Vyberte aspoň jednu reštauráciu.";
        return;
    }

    restaurants.forEach(function (restaurant) {
         if (!selectedRestaurants.includes(restaurant.name)) {
        return;
        }

        const card = document.createElement("article");
        card.className = "restaurant-card";

        const heading = document.createElement("h3");
        heading.textContent = restaurant.name;

        const sourceLink = document.createElement("a");
        sourceLink.href = restaurant.url;
        sourceLink.textContent = "Pôvodná stránka reštaurácie";

        const updateInfo = document.createElement("p");
        updateInfo.className = "restaurant-updated";
        updateInfo.textContent = "Čas aktualizácie nie je dostupný.";

        try {
            const storedText = localStorage.getItem(restaurant.storageKey);

            if (storedText) {
                const storedData = JSON.parse(storedText);

                if (storedData && storedData.updatedAt) {
                    const updatedAt = new Date(storedData.updatedAt);

                    if (!Number.isNaN(updatedAt.getTime())) {
                        const time = document.createElement("time");

                        time.dateTime = updatedAt.toISOString();
                        time.textContent = updatedAt.toLocaleString("sk-SK");

                        updateInfo.replaceChildren(
                            "Posledná aktualizácia: ",
                            time
                        );
                    }
                }
            }

        } catch (error) {
            console.warn("Čas aktualizácie sa nepodarilo prečítať:", error);
        }

        card.append(heading, sourceLink, updateInfo);

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

async function loadMachnac() {
    try {
        const response = await fetch("data/machnac.html");

        if (!response.ok) {
            throw new Error("Nepodarilo sa načítať súbor Machnáč.");
        }

        const html = await response.text();

        const parser = new DOMParser();
        const documentHTML = parser.parseFromString(html, "text/html");

        const dayNames = [
            "pondelok",
            "utorok",
            "streda",
            "štvrtok",
            "piatok"
        ];

        const priceTexts = Array.from(
            documentHTML.querySelectorAll(".denne_menu_ceny h4")
        ).map(function (element) {
            return element.textContent.replace(/\s+/g, " ").trim();
        });

        const soupPrice = priceTexts.find(function (text) {
            return text.toLowerCase().includes("menu polievka");
        }) || "Cena neuvedená";

        const mainPrice = priceTexts.find(function (text) {
            return text.toLowerCase().includes("bez polievky");
        }) || "Cena neuvedená";

        const elements = documentHTML.querySelectorAll(
            ".menu-container .item-name h2, " +
            ".menu-container .item-menu h4"
        );

        const menu = [];

        let currentDay = null;
        let mealIndex = 0;

        elements.forEach(function (element) {
            const text = element.textContent
                .replace(/\s+/g, " ")
                .trim();

            if (element.tagName === "H2") {
                const dayIndex = dayNames.findIndex(function (dayName) {
                    return text.toLowerCase().startsWith(dayName);
                });

                currentDay = dayIndex === -1 ? null : dayIndex + 1;
                mealIndex = 0;

                return;
            }

            if (currentDay === null || !text.startsWith("(")) {
                return;
            }

            const isSoup = mealIndex === 0;

            menu.push({
                restaurant: "Machnáč",
                day: currentDay,
                type: isSoup ? "Polievka" : "Hlavné jedlo",
                name: text,
                priceText: isSoup ? soupPrice : mainPrice
            });

            mealIndex++;
        });

        if (menu.length === 0) {
            throw new Error("V HTML Machnáča sa nenašli jedlá.");
        }

        console.table(menu);

        return menu;

    } catch (error) {
        console.error("Chyba pri načítaní Machnáča:", error);
        return [];
    }
}

async function loadWithCache(storageKey, loader, forceRefresh = false) {
    const today = new Date().toDateString();

    try {
        const storedText = localStorage.getItem(storageKey);

        if (storedText) {
            const storedData = JSON.parse(storedText);

            if (
                !forceRefresh &&
                storedData &&
                storedData.date === today &&
                Array.isArray(storedData.menu) &&
                storedData.menu.length > 0
            ) {
                console.log("Používam uložené menu:", storageKey);

                return storedData.menu;
            }
        }
    } catch (error) {
        console.warn("Uložené menu sa nepodarilo prečítať:", error);
    }

    const menu = await loader();

    if (menu.length > 0) {
        const dataToStore = {
            date: today,
            updatedAt: new Date().toISOString(),
            menu: menu
        };

        try {
            localStorage.setItem(
                storageKey,
                JSON.stringify(dataToStore)
            );

            console.log("Menu bolo uložené:", storageKey);

        } catch (error) {
            console.warn("Menu sa nepodarilo uložiť:", error);
        }
    }

    return menu;
}

async function initializeMenu() {
    const status = document.getElementById("status");
    const container = document.getElementById("menu-container");

    const refreshButton = document.getElementById("refresh-button");
    const clearButton = document.getElementById("clear-button");

    const dayButtons = document.querySelectorAll("button[data-day]");

    const storageKeys = [
        "menu-local-eatandmeet",
        "menu-local-drag",
        "menu-local-machnac"
    ];

    let menu = [];

    const today = new Date().getDay();
    let selectedDay = today >= 1 && today <= 5 ? today : 1;

    async function updateMenu(forceRefresh = false) {
        status.textContent = "Načítavam menu…";
        container.setAttribute("aria-busy", "true");

        refreshButton.disabled = true;
        clearButton.disabled = true;

        dayButtons.forEach(function (button) {
            button.disabled = true;
        });

        try {
            const results = await Promise.all([
                loadWithCache(
                    storageKeys[0],
                    loadEatAndMeet,
                    forceRefresh
                ),
                loadWithCache(
                    storageKeys[1],
                    loadDrag,
                    forceRefresh
                ),
                loadWithCache(
                    storageKeys[2],
                    loadMachnac,
                    forceRefresh
                )
            ]);

            menu = results.flat();

            renderMenu(menu, selectedDay);

            const hasMissingMenu = results.some(function (items) {
                return items.length === 0;
            });

            if (hasMissingMenu) {
                status.textContent =
                    "Menu niektorej reštaurácie sa nepodarilo získať.";
            } else {
                status.textContent = forceRefresh
                    ? "Menu bolo znovu načítané."
                    : "";
            }

        } catch (error) {
            console.error("Chyba pri aktualizácii:", error);

            status.textContent =
                "Menu sa nepodarilo aktualizovať. Skúste to znova.";

        } finally {
            refreshButton.disabled = false;
            clearButton.disabled = false;

            dayButtons.forEach(function (button) {
                button.disabled = false;
            });

            container.setAttribute("aria-busy", "false");
        }
    }

    dayButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            const value = button.dataset.day;

            selectedDay = value === "all"
                ? "all"
                : Number(value);

            renderMenu(menu, selectedDay);
        });
    });

    refreshButton.addEventListener("click", function () {
        updateMenu(true);
    });

    clearButton.addEventListener("click", function () {
        try {
            storageKeys.forEach(function (key) {
                localStorage.removeItem(key);
            });

            menu = [];

            renderMenu(menu, selectedDay);

            status.textContent =
                "Uložené dáta boli vymazané. Menu načítate tlačidlom Aktualizovať menu.";

        } catch (error) {
            console.error("Chyba pri vymazávaní:", error);

            status.textContent =
                "Uložené dáta sa nepodarilo úplne vymazať.";
        }
    });

    const restaurantCheckboxes = document.querySelectorAll(
    'input[name="restaurant"]'
    );

    restaurantCheckboxes.forEach(function (checkbox) {
        checkbox.addEventListener("change", function () {
            renderMenu(menu, selectedDay);
        });
    });
    
    await updateMenu();
}

initializeMenu();
