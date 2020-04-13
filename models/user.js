'use strict';
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Please enter a firstName"
        },
        notNull: {
          msg: "Please enter a firstName"
        }
      }
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Please enter a lastName"
        },
        notNull: {
          msg: "Please enter a lastName"
        }
      }
    },
    emailAddress: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Please enter an emailAddress"
        },
        notNull: {
          msg: "Please enter an emailAddress"
        },
        isEmail: {
          msg: "Please enter a valid emailAddress"
        }
      },
      unique: {
        msg: "That email address is already in use!"
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Please enter a password"
        },
        notNull: {
          msg: "Please enter a password"
        }
      }
    }
  }, {});
  User.associate = function (models) {
    User.hasMany(models.Course)
  };
  return User;
};