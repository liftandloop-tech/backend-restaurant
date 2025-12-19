import mongoose from 'mongoose';
import { ENV } from '../config/env.js';
import Staff from '../models/staff.js';

/**
 * Migration script to fix staff collection indexes and data
 * Run this script once to clean up the database after schema changes
 */

async function fixStaffIndexes() {
    try {
        console.log('🔧 Starting staff database migration...');

        // Connect to MongoDB
        await mongoose.connect(ENV.MONGODB_URI || 'mongodb://localhost:27017/restaurant', {
            serverSelectionTimeoutMS: 5000,
        });
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;
        const collection = db.collection('staffs');

        // Check current indexes
        console.log('📋 Checking current indexes...');
        const indexes = await collection.indexes();
        console.log('Current indexes:', indexes.map(idx => idx.name));

        // Drop old problematic indexes
        const oldIndexes = ['userName_1', 'username_1'];
        for (const indexName of oldIndexes) {
            try {
                const indexExists = indexes.find(idx => idx.name === indexName);
                if (indexExists) {
                    console.log(`🗑️  Dropping old index: ${indexName}`);
                    await collection.dropIndex(indexName);
                    console.log(`✅ Dropped index: ${indexName}`);
                }
            } catch (error) {
                console.log(`⚠️  Could not drop index ${indexName}:`, error.message);
            }
        }

        // Check for documents with null usernames
        console.log('🔍 Checking for documents with null usernames...');
        const nullUsernameDocs = await Staff.find({ username: null });
        console.log(`Found ${nullUsernameDocs.length} documents with null username`);

        if (nullUsernameDocs.length > 0) {
            console.log('⚠️  Documents with null username:');
            nullUsernameDocs.forEach(doc => {
                console.log(`  - ID: ${doc._id}, Name: ${doc.fullName}, Email: ${doc.email}`);
            });

            // Option 1: Delete documents with null usernames (dangerous)
            // console.log('🗑️  Deleting documents with null usernames...');
            // await Staff.deleteMany({ username: null });
            // console.log('✅ Deleted documents with null usernames');

            // Option 2: Set default usernames (safer)
            console.log('🔧 Assigning default usernames to null username documents...');
            for (let i = 0; i < nullUsernameDocs.length; i++) {
                const doc = nullUsernameDocs[i];
                const defaultUsername = `user_${doc._id.toString().slice(-6)}`;
                await Staff.findByIdAndUpdate(doc._id, { username: defaultUsername });
                console.log(`  ✅ Updated ${doc.fullName} with username: ${defaultUsername}`);
            }
        }

        // Rebuild indexes
        console.log('🔨 Rebuilding indexes...');
        await Staff.syncIndexes();
        console.log('✅ Indexes rebuilt');

        // Verify the fix
        console.log('🔍 Verifying the fix...');
        const finalIndexes = await collection.indexes();
        console.log('Final indexes:', finalIndexes.map(idx => idx.name));

        const totalStaff = await Staff.countDocuments();
        const nullUsernameCount = await Staff.countDocuments({ username: null });
        console.log(`📊 Total staff: ${totalStaff}`);
        console.log(`📊 Staff with null username: ${nullUsernameCount}`);

        if (nullUsernameCount === 0) {
            console.log('✅ Migration completed successfully!');
        } else {
            console.log('⚠️  Migration completed but some documents still have null usernames');
        }

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

// Run the migration
fixStaffIndexes().catch(console.error);
