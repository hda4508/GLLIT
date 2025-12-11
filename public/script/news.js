document.addEventListener("DOMContentLoaded", () => {

            const grid = document.getElementById("calendarGrid");
            const monthTitle = document.getElementById("monthTitle");

            const prevBtn = document.getElementById("prevMonth");
            const nextBtn = document.getElementById("nextMonth");

            const modal = document.getElementById("dayModal");
            const closeModal = document.getElementById("closeModal");
            const modalDate = document.getElementById("modalDate");
            const modalEvents = document.getElementById("modalEvents");

            let current = new Date();
            let events = {};

            function loadSchedule() {
                return fetch("/api/schedule")
                    .then(res => res.json())
                    .then(data => {
                        events = {};
                        data.forEach(item => {
                            events[item.date] = {
                                title: Array.isArray(item.title) ? item.title : [item.title],
                                type: Array.isArray(item.type) ? item.type : [item.type]
                            };
                        });
                        renderCalendar(current);
                    });
            }

            function renderCalendar(date) {
                grid.innerHTML = "";

                const year = date.getFullYear();
                const month = date.getMonth();

                monthTitle.textContent = `${year} • ${month + 1}월`;

                const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
                dayNames.forEach(name => {
                    const div = document.createElement("div");
                    div.className = "day-name";
                    div.textContent = name;
                    grid.appendChild(div);
                });

                const firstDay = new Date(year, month, 1).getDay();
                const lastDate = new Date(year, month + 1, 0).getDate();

                for (let i = 0; i < firstDay; i++) {
                    grid.appendChild(document.createElement("div"));
                }

                for (let d = 1; d <= lastDate; d++) {

                    const fullDate = `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;

                    const cell = document.createElement("div");
                    cell.className = "day";

                    const num = document.createElement("div");
                    num.className = "day-number";
                    num.textContent = d;

                    const weekDay = new Date(year, month, d).getDay();
                    if (weekDay === 0) num.classList.add("sunday");
                    if (weekDay === 6) num.classList.add("saturday");

                    const today = new Date();
                    if (
                        today.getFullYear() === year &&
                        today.getMonth() === month &&
                        today.getDate() === d
                    ) {
                        cell.classList.add("today");
                    }

                    const dots = document.createElement("div");
                    dots.className = "dots";

                    if (events[fullDate]) {
                        events[fullDate].type.forEach(color => {
                            const dot = document.createElement("span");
                            dot.className = "event-dot";
                            dot.style.background = color;
                            dots.appendChild(dot);
                        });
                    }

                    cell.addEventListener("click", () => {
                        modal.style.display = "flex";
                        modalDate.textContent = fullDate;
                        modalEvents.innerHTML = "";

                        if (events[fullDate]) {
                            events[fullDate].title.forEach((t, i) => {
                                const wrap = document.createElement("div");
                                wrap.className = "event-item";
                                wrap.innerHTML = `
                            <span class="event-dot-small" style="background:${events[fullDate].type[i]}"></span>
                            ${t}
                        `;
                                modalEvents.appendChild(wrap);
                            });
                        } else {
                            modalEvents.innerHTML = "일정이 없습니다.";
                        }
                    });

                    cell.appendChild(num);
                    cell.appendChild(dots);
                    grid.appendChild(cell);
                }
            }

            prevBtn.addEventListener("click", () => {
                current.setMonth(current.getMonth() - 1);
                renderCalendar(current);
            });

            nextBtn.addEventListener("click", () => {
                current.setMonth(current.getMonth() + 1);
                renderCalendar(current);
            });

            closeModal.addEventListener("click", () => {
                modal.style.display = "none";
            });

            modal.addEventListener("click", (e) => {
                if (e.target === modal) modal.style.display = "none";
            });

            loadSchedule();
        });