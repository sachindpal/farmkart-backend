import bcrypt from "bcrypt";

/**
 * Crypt password.
 *
 * @param  {String}   password
 * @returns {String}
 */
const cryptPassword = function( password ) {
    const hash = bcrypt.hashSync( password, Number(process.env.PASSWORD_SALT_ROUNDS ));
    return hash;
};

const compare = function( password, hashedPassword ) {
    const match = bcrypt.compare(password, hashedPassword);
    return match;
};


const password = {
    cryptPassword,
    compare
};


export default password;
