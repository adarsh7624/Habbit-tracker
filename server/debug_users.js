require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const fs = require('fs');
mongoose.connect(process.env.MONGO_URI).then(async () => {
    const admin = new mongoose.mongo.Admin(mongoose.connection.db);
    const result = await admin.listDatabases();

    const output = result.databases.map(db => `${db.name} (${db.sizeOnDisk})`).join('\n');
    fs.writeFileSync('db_list.txt', output);
    console.log("Written to db_list.txt");

    process.exit(0);
}).catch(e => {
    console.error(e);
    process.exit(1);
});
