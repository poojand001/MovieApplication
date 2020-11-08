module.exports = (sequelize, Sequelize) => {
    const User = sequelize.define("User", {
        UserName: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        EmailId: {
            type: Sequelize.STRING,
            allowNull: false,
            primaryKey: true,
            validate: {
                isEmail: true
            }
        },
        Password: {
            type: Sequelize.STRING
        },
    });

    return User;
};