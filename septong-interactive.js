document.addEventListener('DOMContentLoaded', function() {
    // --- KHAI BÁO BIẾN TOÀN CỤC ---
    const tableBody = document.querySelector('.schedule-table tbody');
    const resetButton = document.getElementById('reset-button'); // Đảm bảo ID nút reset là 'reset-schedule-button'
    const assignButton = document.getElementById('sapxepca'); // Đảm bảo ID nút chia ca là 'auto-assign-button'
    const exportButton = document.getElementById('submit-button');

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
                    // Mặc định, lấy tất cả người đăng ký, phân cách bằng dấu gạch ngang
                    personToDisplay = registrants.map(r => r.ten).join(' - ');
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

    // --- 4. SỰ KIỆN CLICK NÚT CHIA CA (THUẬT TOÁN "BẢO HIỂM") ---
// --- 4. SỰ KIỆN CLICK NÚT CHIA CA (THUẬT TOÁN "ƯU TIÊN TỐI ĐA") ---
if (assignButton) {
    assignButton.addEventListener('click', function() {
        const allRegistrations = JSON.parse(localStorage.getItem('danhSachDangKy')) || [];
        if (allRegistrations.length === 0) {
            alert("Không có dữ liệu đăng ký nào để chia ca!");
            return;
        }

        // --- BƯỚC 1: CHUẨN BỊ DỮ LIỆU ---
        const finalSchedule = {};

        // 1.1. Đếm tổng số ca mỗi người đã ĐĂNG KÝ
        const totalRegisteredShifts = {};
        allRegistrations.forEach(reg => {
            totalRegisteredShifts[reg.ten] = (totalRegisteredShifts[reg.ten] || 0) + 1;
        });

        // 1.2. Lấy danh sách nhân viên và sắp xếp họ theo thứ tự ưu tiên (người ĐĂNG KÝ ÍT CA NHẤT lên đầu)
        const staffNamesSortedByRarity = Object.keys(totalRegisteredShifts).sort((a, b) => {
            return totalRegisteredShifts[a] - totalRegisteredShifts[b];
        });
        console.log("Thứ tự ưu tiên xử lý:", staffNamesSortedByRarity);


        // --- BƯỚC 2: BẮT ĐẦU VÒNG LẶP ƯU TIÊN ---
        // Duyệt qua từng nhân viên THEO THỨ TỰ ƯU TIÊN
        staffNamesSortedByRarity.forEach(name => {
            console.log(`--- Đang xét duyệt cho nhân viên ưu tiên: ${name}`);

            // Lấy tất cả các ca mà người này đã đăng ký
            const registeredShiftsForThisPerson = allRegistrations
                .filter(reg => reg.ten === name)
                .map(reg => `${reg.boPhan}|${reg.ngay}|${reg.ca}`);
            
            // Duyệt qua từng ca đã đăng ký của họ
            registeredShiftsForThisPerson.forEach(shiftKey => {
                // Nếu ca này vẫn còn trống...
                if (!finalSchedule[shiftKey]) {
                    // ... Giao ngay cho họ!
                    finalSchedule[shiftKey] = name;
                    console.log(`   -> Đã xếp cho ${name} vào ca còn trống: ${shiftKey}`);
                }
            });
        });

        
        // BƯỚC 3: HIỂN THỊ KẾT QUẢ
        renderSchedule(finalSchedule);
        
        const assignedShiftCounts = {};
        Object.values(finalSchedule).forEach(name => {
            assignedShiftCounts[name] = (assignedShiftCounts[name] || 0) + 1;
        });
        console.log("Phân chia ca hoàn tất. Kết quả cuối cùng:", finalSchedule);
        console.log("Tổng số ca được giao của mỗi người:", assignedShiftCounts);
    });
}

    // --- 5. SỰ KIỆN CLICK NÚT XUẤT LỊCH (PHIÊN BẢN NÂNG CẤP) ---
if (exportButton) {
    exportButton.addEventListener('click', function() {
        const table = document.querySelector('.schedule-table');
        if (!table) {
            alert('Không tìm thấy bảng lịch làm!');
            return;
        }

        // TẠM ẨN CÁC PHẦN TỬ KHÔNG MONG MUỐN
        const arrows = table.querySelectorAll('.dropdown-arrow');
        arrows.forEach(arrow => arrow.classList.add('hide-for-export'));
        
        const options = {
            scale: 2,
            useCORS: true,
            // Thêm tùy chọn này để đảm bảo ảnh nền cũng được vẽ (nếu có)
            backgroundColor: 'white'
        };

        html2canvas(table, options).then(canvas => {
            // "Chụp ảnh" xong, tạo link và tải về
            const link = document.createElement('a');
            link.download = 'lich-lam-viec.png';
            link.href = canvas.toDataURL('image/png');
            link.click();

        }).catch(error => {
            // Xử lý nếu có lỗi xảy ra
            console.error("Lỗi khi xuất ảnh:", error);
            alert("Đã có lỗi xảy ra trong quá trình xuất ảnh. Vui lòng thử lại.");

        }).finally(() => {
            // LUÔN LUÔN HIỆN LẠI CÁC MŨI TÊN
            // .finally() sẽ được gọi dù cho quá trình .then() thành công hay .catch() thất bại
            arrows.forEach(arrow => arrow.classList.remove('hide-for-export'));
        });
    });
}
    // --- CHẠY LẦN ĐẦU KHI TẢI TRANG ---
    renderSchedule(); // Gọi không có tham số để hiển thị mặc định
});