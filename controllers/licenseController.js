    import { catchAsync } from "../utils/errorHandler.js";
    import { verifyLicenseKey } from "../services/license.service.js";

    export const verifyLicense = catchAsync(async (req, res) => {
        const { licenseKey} = req.body;
        const restaurantId = req.user.restaurantId;

    if (!licenseKey) {
        return res.status(400).json({
            success: false,
            message: "License key is required"

        })
    }

    const result = await verifyLicenseKey(licenseKey, restaurantId);

    res.status(200).json({
        success:true,
        message: "Liecense verified and activeted sucessfully",
        data: result
    })
  })