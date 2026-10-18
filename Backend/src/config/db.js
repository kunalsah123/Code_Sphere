const mongoose = require('mongoose');

async function main() {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
        throw new Error('MONGO_URI is missing. Set it in Backend/.env before starting the backend.');
    }

    if (!mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://')) {
        throw new Error('MONGO_URI must start with mongodb:// or mongodb+srv://. Copy the application URI from MongoDB Atlas.');
    }

    await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 10000,
        appName: 'CodeSphere'
    });

    // Older versions incorrectly declared problemSolved array values unique,
    // creating a unique multikey index that rejects every new user without it.
    const usersCollection = mongoose.connection.collection('users');
    let userIndexes = [];
    try {
        userIndexes = await usersCollection.indexes();
    } catch (error) {
        if (error.code !== 26 && error.codeName !== 'NamespaceNotFound') throw error;
    }
    const invalidSolvedIndex = userIndexes.find((index) =>
        index.name === 'problemSolved_1'
        && index.unique === true
        && index.key?.problemSolved === 1
    );
    if (invalidSolvedIndex) {
        await usersCollection.dropIndex(invalidSolvedIndex.name);
        console.log('✅ Removed obsolete unique users.problemSolved index.');
    }
}

module.exports = main;
