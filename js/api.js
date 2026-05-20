class APIResource {
  constructor(apiBaseURL, resourceName) {
    this.resourceName = resourceName;
    this.baseUrl = `${apiBaseURL}/${resourceName}`;
  }

  async layDanhSach() {
    const response = await fetch(this.baseUrl);

    if (!response.ok) {
      throw new Error(`Không thể lấy danh sách ${this.resourceName}`);
    }

    const data = await response.json();
    console.log(`Danh sách ${this.resourceName}:`, data);
    return data;
  }

  async layMotPhan(id) {
    const response = await fetch(`${this.baseUrl}/${id}`);

    if (!response.ok) {
      throw new Error(`Không thể lấy ${this.resourceName} có id = ${id}`);
    }

    const data = await response.json();
    console.log(`Một ${this.resourceName}:`, data);
    return data;
  }

  async themMoi(dinhNghia) {
    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dinhNghia),
    });

    if (!response.ok) {
      throw new Error(`Không thể thêm ${this.resourceName}`);
    }

    const data = await response.json();
    console.log(`Đã thêm ${this.resourceName}:`, data);
    return data;
  }

  async capNhat(id, thongTinMoi) {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(thongTinMoi),
    });

    if (!response.ok) {
      throw new Error(`Không thể cập nhật ${this.resourceName} có id = ${id}`);
    }

    const data = await response.json();
    console.log(`Đã cập nhật ${this.resourceName}:`, data);
    return data;
  }

  async xoa(id) {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(`Không thể xóa ${this.resourceName} có id = ${id}`);
    }

    const data = await response.json();
    console.log(`Đã xóa ${this.resourceName}:`, data);
    return data;
  }
}

function hienThiDanhSach(danhSach, elementId, renderItem) {
  const danhSachElement = document.getElementById(elementId);

  if (!danhSachElement) {
    return;
  }

  danhSachElement.innerHTML = danhSach
    .map(function (item) {
      return renderItem(item);
    })
    .join("");
}

function renderSinhVien(sinhVien) {
  return (
    "<div>" +
    "<strong>" +
    sinhVien.id +
    "</strong> - " +
    (sinhVien.name || "Chưa có tên") +
    " - " +
    (sinhVien.studentCode || "Chưa có mã sinh viên") +
    " - " +
    (sinhVien.gender ? "Nữ" : "Nam") +
    "</div>"
  );
}

const API_BASE_URL = "https://69f9a69cc509a40d3aa2ee09.mockapi.io/api/v1/products";

const sinhVienAPI = new APIResource(API_BASE_URL, "students");

async function initApp() {
  try {
    const danhSach = await sinhVienAPI.layDanhSach();
    hienThiDanhSach(danhSach, "danhSach", renderSinhVien);
  } catch (error) {
    console.error(error);
  }
}

initApp();
