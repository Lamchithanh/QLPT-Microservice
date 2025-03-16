const Apartment = require("../models/Apartment");

// Lấy tất cả căn hộ
exports.getAllApartments = async (req, res) => {
  try {
    // Xây dựng query
    const queryObj = { ...req.query };
    const excludedFields = ["page", "sort", "limit", "fields"];
    excludedFields.forEach((el) => delete queryObj[el]);

    // Filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    let query = Apartment.find(JSON.parse(queryStr));

    // Sorting
    if (req.query.sort) {
      const sortBy = req.query.sort.split(",").join(" ");
      query = query.sort(sortBy);
    } else {
      query = query.sort("-createdAt");
    }

    // Field limiting
    if (req.query.fields) {
      const fields = req.query.fields.split(",").join(" ");
      query = query.select(fields);
    } else {
      query = query.select("-__v");
    }

    // Pagination
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 100;
    const skip = (page - 1) * limit;

    query = query.skip(skip).limit(limit);

    // Execute query
    const apartments = await query;

    res.status(200).json({
      status: "success",
      results: apartments.length,
      data: {
        apartments,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

// Lấy thông tin một căn hộ theo ID
exports.getApartment = async (req, res) => {
  try {
    const apartment = await Apartment.findById(req.params.id);

    if (!apartment) {
      return res.status(404).json({
        status: "fail",
        message: "Không tìm thấy căn hộ với ID này",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        apartment,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

// Tạo căn hộ mới
exports.createApartment = async (req, res) => {
  try {
    const newApartment = await Apartment.create(req.body);

    res.status(201).json({
      status: "success",
      data: {
        apartment: newApartment,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

// Cập nhật thông tin căn hộ
exports.updateApartment = async (req, res) => {
  try {
    const apartment = await Apartment.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!apartment) {
      return res.status(404).json({
        status: "fail",
        message: "Không tìm thấy căn hộ với ID này",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        apartment,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

// Xóa căn hộ
exports.deleteApartment = async (req, res) => {
  try {
    const apartment = await Apartment.findByIdAndDelete(req.params.id);

    if (!apartment) {
      return res.status(404).json({
        status: "fail",
        message: "Không tìm thấy căn hộ với ID này",
      });
    }

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};
