import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import "../config/env.js";
import User from "../models/user.js";
import { ROLES } from "../middlewares/roles.js";

const printUsage = () => {
  console.log("\nUsage:");
  console.log("  node scripts/updateUserRole.js <email> <role>");
  console.log("  npm run update-role -- <email> <role>\n");
  console.log("Example:");
  console.log('  npm run update-role -- "waiter@example.com" Cashier\n');
};

const run = async () => {
  const [, , email, targetRole] = process.argv;

  if (!email || !targetRole) {
    console.error(" Missing required arguments.\n");
    printUsage();
    process.exit(1);
  }

  const allowedRoles = Object.values(ROLES);
  if (!allowedRoles.includes(targetRole)) {
    console.error(` Invalid role "${targetRole}". Allowed roles: ${allowedRoles.join(", ")}`);
    process.exit(1);
  }

  try {
    await connectDB();
    const user = await User.findOne({ email });

    if (!user) {
      console.error(` User with email "${email}" not found.`);
      process.exit(1);
    }

    const previousRole = user.role;
    user.role = targetRole;
    await user.save({ validateBeforeSave: false });

    console.log(" Role updated successfully!");
    console.log(`   User   : ${user.name || user.email}`);
    console.log(`   Email  : ${user.email}`);
    console.log(`   From   : ${previousRole}`);
    console.log(`   To     : ${targetRole}`);
  } catch (error) {
    console.error(" Failed to update user role:", error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
};

run();

