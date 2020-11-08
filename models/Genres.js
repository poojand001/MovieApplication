module.exports = (sequelize, Sequelize) => {
    const Genres = sequelize.define("Genres", {
        Id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true
        },
        Name: {
            type: Sequelize.STRING,
            allowNull: false
        }
    });

    return Genres;
};