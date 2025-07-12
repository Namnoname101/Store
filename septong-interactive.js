document.addEventListener('DOMContentLoaded', function() {
    // --- KHAI BÁO BIẾN TOÀN CỤC ---
    const tableBody = document.querySelector('.schedule-table tbody');
    const resetButton = document.getElementById('reset-button'); // Đảm bảo ID nút reset là 'reset-schedule-button'
    const assignButton = document.getElementById('sapxepca'); // Đảm bảo ID nút chia ca là 'auto-assign-button'

    //================================================================
    // HÀM RENDER "SIÊU CẤP" - CÓ THỂ NHẬN CHỈ THỊ
    //================================================================
    function renderSchedule(assignments = {}) {
        const allRegistrations = JSON.parse(localStorage.getItem('danhSachDangKy')) || [];

        const scheduleData = {};
        allRegistrations.forEach(reg => {
            if (reg && reg.boPhan && reg.ngay && reg.ca) {
                const key = `${reg.boPhan}|${reg.ngay}|${reg.ca}`;
                if (!scheduleData[key]) scheduleData[key] = [];
                scheduleData[key].push(reg);
            }
        });

        for (const key in scheduleData) {
            scheduleData[key].sort((a, b) => a.timestamp - b.timestamp);
        }

        tableBody.querySelectorAll('td').forEach(cell => cell.innerHTML = '');

        for (const key in scheduleData) {
            const registrants = scheduleData[key];
            if (registrants.length === 0) continue;

            const [boPhan, ngay, ca] = key.split('|');
            const cell = tableBody.querySelector(`td[data-bophan='${boPhan}'][data-ngay='${ngay}'][data-ca='${ca}']`);

            if (cell) {
                // ---- LOGIC THÔNG MINH NẰM Ở ĐÂY ----
                // 1. Xác định ai sẽ được hiển thị chính
                let personToDisplay;
                if (assignments[key]) {
                    // Nếu có "chỉ thị" (từ nút Chia Ca), hãy dùng tên người được giao
                    personToDisplay = assignments[key];
                } else {
                    // Mặc định, lấy người đăng ký đầu tiên
                    personToDisplay = registrants[0].ten;
                }

                // 2. Xây dựng HTML dựa trên quyết định trên
                if (registrants.length === 1) {
                    cell.textContent = personToDisplay;
                } else {
                    const listItems = registrants.map(reg => `<li>${reg.ten}</li>`).join('');
                    cell.innerHTML = `
                        <div class="cell-content dropdown-trigger">
                            <span>${personToDisplay}</span>
                            <span class="dropdown-arrow">▼</span>
                        </div>
                        <ul class="dropdown-menu">
                            ${listItems}
                        </ul>
                    `;
                }
            }
        }
    }
    
    //================================================================
    // CÁC HÀM TIỆN ÍCH
    //================================================================
    function closeAllDropdowns(exceptThisOne = null) {
        document.querySelectorAll('.dropdown-menu.show').forEach(openMenu => {
            if (openMenu !== exceptThisOne) {
                openMenu.classList.remove('show');
            }
        });
    }

    //================================================================
    // CÁC BỘ LẮNG NGHE SỰ KIỆN (EVENT LISTENERS)
    //================================================================

    // --- 1. SỰ KIỆN CLICK VÀO BẢNG (Mở/Đóng/Chọn Dropdown) ---
    tableBody.addEventListener('click', function(event) {
        const target = event.target;
        if (target.tagName === 'LI') {
            const newName = target.textContent;
            const parentCell = target.closest('td');
            const nameSpan = parentCell.querySelector('.cell-content span:first-child');
            if (nameSpan) {
                nameSpan.textContent = newName;
            }
            target.closest('.dropdown-menu').classList.remove('show');
            return;
        }
        const trigger = target.closest('.dropdown-trigger');
        if (trigger) {
            const menu = trigger.nextElementSibling;
            const isCurrentlyOpen = menu.classList.contains('show');
            closeAllDropdowns();
            if (!isCurrentlyOpen) {
                menu.classList.add('show');
            }
        }
    });

    // --- 2. SỰ KIỆN CLICK RA NGOÀI ĐỂ ĐÓNG DROPDOWN ---
    window.addEventListener('click', function(event) {
        if (!event.target.closest('td')) {
            closeAllDropdowns();
        }
    });

    // --- 3. SỰ KIỆN CLICK NÚT RESET ---
    if (resetButton) {
        resetButton.addEventListener('click', function() {
            if (confirm("Bạn có chắc chắn muốn xóa TOÀN BỘ lịch làm việc không?")) {
                localStorage.removeItem('danhSachDangKy');
                renderSchedule(); // Gọi hàm render để cập nhật bảng trống
                alert("Đã xóa thành công toàn bộ lịch làm việc.");
            }
        });
    }

    // --- 4. SỰ KIỆN CLICK NÚT CHIA CA ---
    if (assignButton) {
        assignButton.addEventListener('click', function() {
            const allRegistrations = JSON.parse(localStorage.getItem('danhSachDangKy')) || [];
            if (allRegistrations.length === 0) {
                alert("Không có dữ liệu đăng ký nào để chia ca!");
                return;
            }
            // --- THUẬT TOÁN CHIA ĐỀU (giữ nguyên) ---
            const shiftCounts = {};
            allRegistrations.forEach(reg => {
                if (!shiftCounts.hasOwnProperty(reg.ten)) {
                    shiftCounts[reg.ten] = 0;
                }
            });
            const scheduleData = {};
            allRegistrations.forEach(reg => {
                if (reg && reg.boPhan && reg.ngay && reg.ca) {
                    const key = `${reg.boPhan}|${reg.ngay}|${reg.ca}`;
                    if (!scheduleData[key]) scheduleData[key] = [];
                    scheduleData[key].push(reg);
                }
            });
            const finalSchedule = {};
            for (const key in scheduleData) {
                const candidates = scheduleData[key];
                candidates.sort((a, b) => {
                    const countDiff = shiftCounts[a.ten] - shiftCounts[b.ten];
                    if (countDiff !== 0) return countDiff;
                    return a.timestamp - b.timestamp;
                });
                const winner = candidates[0];
                finalSchedule[key] = winner.ten;
                shiftCounts[winner.ten]++;
            }

            // ---- THAY ĐỔI QUAN TRỌNG NHẤT LÀ Ở ĐÂY ----
            // Gọi lại "siêu" hàm render và truyền kết quả chia ca vào làm "chỉ thị"
            renderSchedule(finalSchedule);
            
            console.log("Phân chia ca hoàn tất. Giao diện đã được cập nhật.");
        });
    }

    // --- CHẠY LẦN ĐẦU KHI TẢI TRANG ---
    renderSchedule(); // Gọi không có tham số để hiển thị mặc định
});