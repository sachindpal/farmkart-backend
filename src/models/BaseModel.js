import knexJs from "knex";
import knexConfig from "../knexfile.cjs";


// const knexConfig = require("../knexfile.cjs")
const knex = knexJs(knexConfig);

/**
 * define base model
 */
class BaseModel {

    /**
     * Get a all rows from table.
     *
     * @param {String} tableName The query to match against.
     */
    fetchAll(tableName) {
        const q = knex(tableName)
            .select();
        console.log('kkkk', q.toString());
        return q.map((res) => {
            return res;
        });
    }

    /**
     * Get a collection of models matching a given query.
     *
     * @param {Object} query The query to match against.
     * @param {String} tableName The query to match against.
     * @returns {Array} An array holding resultant models.
     */
    fetchObj(query = {}, tableName) {

        return knex(tableName)
            .select()
            .where(query)
            .map((res) => {
                return res;
            });
    }

    /**
     * Get a collection of models matching a given query.
     *
     * @param {Object} query The query to match against.
     * @param {String} tableName The query to match against.
     * @returns {Array} An array holding resultant models.
     */
    fetchFirstObj(query = {}, tableName) {
        return knex(tableName)
            .select()
            .where(query)
            .first();
    }

    /**
    * Inserts a new model into the database then returns an instantiation of the model.
    *
    * @param {Object} properties The Model properties.
    * @param {String} tableName The query to match against.
    * @returns {*} An instantiation of the model.
    */
    createObj(properties, tableName) {

        return knex(tableName)
            .insert(properties)
            .spread((res) => {
                return res;
            });
    }

    /**
     * Saves the properties currently set on the model.
     *
     * @param {Object} properties The properties to update.
     * @param {Object} query Where clause for updating.
     * @param {String} tableName The query to match against.
     * @returns {Array} A collection of the updated models.
     */
    updateObj(properties, query = {}, tableName) {

        return knex(tableName)
            .update(properties)
            .where(query)
            .then((res) => {
                return res;
            });
    }

    fetchMultipleWithJoin(opts = [], query = {}, joinKey, joinTable, tableKey, tableName) {
        let prepareQuery =  knex(tableName)
            .select(knex.raw(opts))
            .leftJoin(joinTable, `${tableName}.${tableKey}`, `${joinTable}.${joinKey}`)
            .where(query);

        prepareQuery = prepareQuery.map((res) => {
            return res;
        });

        return prepareQuery;
    }

    fetchSingleWithJoin(opts = [], query = {}, joinKey, joinTable, tableKey, tableName) {
        return knex(tableName)
            .select(knex.raw(opts))
            .leftJoin(joinTable, `${tableName}.${tableKey}`, `${joinTable}.${joinKey}`)
            .where(query)
            .first();
    }

}
export default BaseModel;
