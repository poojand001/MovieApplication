const dbConfig = require("../config/db.config.js");
const Sequelize = require("sequelize");
const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
    host: dbConfig.HOST,
    dialect: dbConfig.dialect,
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false // <<<<<<< YOU NEED THIS
        }
    },
    define: {
        timestamps: false
    },
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.Movies = require("./Movies.js")(sequelize, Sequelize);
db.Genres = require("./Genres.js")(sequelize, Sequelize);
db.MoviesGenres = require("./MoviesGenres.js")(sequelize, Sequelize);
db.User = require("./User.js")(sequelize, Sequelize);
db.Movies.belongsToMany(db.Genres, { through: db.MoviesGenres });
db.Genres.belongsToMany(db.Movies, { through: db.MoviesGenres });
module.exports = db;