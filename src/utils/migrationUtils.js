'use strict';

/**
 * Migration utility functions to handle dialect-specific operations
 * and provide consistent patterns across migrations
 */

/**
 * Creates enum types based on the database dialect
 * 
 * @param {Object} queryInterface - Sequelize QueryInterface
 * @param {Object} Sequelize - Sequelize instance
 * @param {Object} enumDefinitions - Map of enum names to arrays of values
 * @param {Object} transaction - Sequelize transaction
 * @returns {Promise} - Resolves when all enum types are created
 */
async function createEnumTypes(queryInterface, Sequelize, enumDefinitions, transaction) {
  const dialect = queryInterface.sequelize.getDialect();
  
  try {
    if (dialect === 'postgres') {
      // For PostgreSQL, create native ENUM types which are more efficient
      const enumCreationQueries = Object.entries(enumDefinitions)
        .map(([name, values]) => {
          const valuesString = values.map(v => `'${v}'`).join(', ');
          return `CREATE TYPE ${name} AS ENUM (${valuesString});`;
        })
        .join('\n');
      
      await queryInterface.sequelize.query(enumCreationQueries, { transaction });
    } else if (dialect === 'mysql' || dialect === 'mariadb') {
      // For MySQL/MariaDB, we don't need to do anything special here
      // The ENUM types will be created when used in table definitions
      console.log('MySQL/MariaDB will handle ENUMs within table column definitions');
    } else if (dialect === 'sqlite') {
      // For SQLite, we'll create a reference table for each enum type
      // This is an alternative approach since SQLite doesn't have native ENUM types
      for (const [name, values] of Object.entries(enumDefinitions)) {
        // Create reference table
        await queryInterface.createTable(`enum_${name}`, {
          value: {
            type: Sequelize.STRING(50),
            primaryKey: true,
            allowNull: false
          }
        }, { transaction });
        
        // Insert values
        for (const value of values) {
          await queryInterface.bulkInsert(`enum_${name}`, [{ value }], { transaction });
        }
      }
    } else {
      // For other dialects like MSSQL, create check constraints in each table
      console.log(`Dialect '${dialect}' will handle ENUMs through CHECK constraints or similar mechanisms`);
    }
    return true;
  } catch (error) {
    console.error(`Error creating enum types: ${error.message}`);
    throw error;
  }
}

/**
 * Drops enum types based on the database dialect
 * 
 * @param {Object} queryInterface - Sequelize QueryInterface
 * @param {Array} enumTypes - Array of enum type names to drop
 * @param {Object} transaction - Sequelize transaction
 * @returns {Promise} - Resolves when all enum types are dropped
 */
async function dropEnumTypes(queryInterface, enumTypes, transaction) {
  const dialect = queryInterface.sequelize.getDialect();
  
  try {
    if (dialect === 'postgres') {
      // For PostgreSQL, drop the native ENUM types
      // Use IF EXISTS to avoid errors if the type doesn't exist
      // Use CASCADE to handle cases where the enum is still in use
      const enumDropQueries = enumTypes
        .map(name => `DROP TYPE IF EXISTS ${name} CASCADE;`)
        .join('\n');
      
      await queryInterface.sequelize.query(enumDropQueries, { transaction });
    } else if (dialect === 'sqlite') {
      // For SQLite, drop the reference tables
      for (const name of enumTypes) {
        await queryInterface.dropTable(`enum_${name}`, { transaction });
      }
    } 
    // For MySQL and other dialects, no special cleanup needed
    // as the enum types are part of column definitions
    return true;
  } catch (error) {
    console.error(`Error dropping enum types: ${error.message}`);
    // In real production code, you might want to handle specific errors differently
    // For now, we'll just rethrow to trigger the transaction rollback
    throw error;
  }
}

/**
 * Adds custom constraints to a table across different database dialects
 * 
 * @param {Object} queryInterface - Sequelize QueryInterface
 * @param {string} tableName - Name of the table to add constraints to
 * @param {Object} constraints - Map of constraint definitions
 * @param {Object} transaction - Sequelize transaction
 * @returns {Promise} - Resolves when all constraints are added
 */
async function addConstraints(queryInterface, tableName, constraints, transaction) {
  const dialect = queryInterface.sequelize.getDialect();
  
  try {
    // Create appropriate constraint SQL based on dialect
    let constraintQueries = [];
    
    if (dialect === 'postgres') {
      // PostgreSQL supports full CHECK constraints
      constraintQueries = Object.entries(constraints).map(([name, definition]) => {
        return `ALTER TABLE ${tableName} ADD CONSTRAINT ${name} CHECK (${definition});`;
      });
      
      if (constraintQueries.length > 0) {
        await queryInterface.sequelize.query(constraintQueries.join("\n"), { transaction });
      }
    } else if (dialect === 'sqlite') {
      // SQLite has limited CHECK constraint support
      constraintQueries = Object.entries(constraints).map(([name, definition]) => {
        return `ALTER TABLE ${tableName} ADD CONSTRAINT ${name} CHECK (${definition});`;
      });
      
      if (constraintQueries.length > 0) {
        // SQLite may not support multiple ALTER TABLE statements in one query
        for (const query of constraintQueries) {
          await queryInterface.sequelize.query(query, { transaction });
        }
      }
    } else if (dialect === 'mysql' || dialect === 'mariadb') {
      // MySQL 8.0.16+ supports CHECK constraints, older versions ignore them
      // For older versions, we could create triggers to enforce constraints
      const mysqlVersion = await getMySQLVersion(queryInterface, transaction);
      
      if (mysqlVersion && mysqlVersion >= 80016) {
        // MySQL 8.0.16+ supports CHECK constraints
        constraintQueries = Object.entries(constraints).map(([name, definition]) => {
          return `ALTER TABLE ${tableName} ADD CONSTRAINT ${name} CHECK (${definition});`;
        });
        
        if (constraintQueries.length > 0) {
          await queryInterface.sequelize.query(constraintQueries.join("\n"), { transaction });
        }
      } else {
        console.log('MySQL/MariaDB: CHECK constraints will be handled at application level for versions < 8.0.16');
        // For production code, we might implement trigger-based constraints here
      }
    } else {
      console.log(`Dialect '${dialect}': Constraints will be handled at application level`);
    }
    
    return true;
  } catch (error) {
    console.error(`Error adding constraints to ${tableName}: ${error.message}`);
    throw error;
  }
}

/**
 * Get MySQL version as a numeric value (e.g., 80016 for 8.0.16)
 * 
 * @param {Object} queryInterface - Sequelize QueryInterface
 * @param {Object} transaction - Sequelize transaction
 * @returns {Promise<number|null>} - Resolves with MySQL version as a number or null
 */
async function getMySQLVersion(queryInterface, transaction) {
  try {
    const [results] = await queryInterface.sequelize.query('SELECT VERSION() as version', { transaction });
    if (results && results[0] && results[0].version) {
      const versionString = results[0].version;
      const match = versionString.match(/^(\d+)\.(\d+)\.(\d+)/);
      if (match) {
        const major = parseInt(match[1], 10);
        const minor = parseInt(match[2], 10);
        const patch = parseInt(match[3], 10);
        return major * 10000 + minor * 100 + patch;
      }
    }
    return null;
  } catch (error) {
    console.error(`Error getting MySQL version: ${error.message}`);
    return null;
  }
}

/**
 * Adds an email validation constraint to a table
 * 
 * @param {Object} queryInterface - Sequelize QueryInterface
 * @param {string} tableName - Name of the table
 * @param {string} columnName - Name of the email column
 * @param {Object} transaction - Sequelize transaction
 * @returns {Promise} - Resolves when the constraint is added
 */
async function addEmailValidationConstraint(queryInterface, tableName, columnName, transaction) {
  const dialect = queryInterface.sequelize.getDialect();
  
  try {
    if (dialect === 'postgres') {
      // PostgreSQL regex for basic email validation
      await queryInterface.sequelize.query(`
        ALTER TABLE ${tableName}
        ADD CONSTRAINT check_${columnName}_format
        CHECK (${columnName} ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$');
      `, { transaction });
    } else if (dialect === 'sqlite') {
      // SQLite has more limited regex support
      await queryInterface.sequelize.query(`
        ALTER TABLE ${tableName}
        ADD CONSTRAINT check_${columnName}_format
        CHECK (${columnName} LIKE '%@%.%' AND length(${columnName}) >= 5);
      `, { transaction });
    } else if (dialect === 'mysql' || dialect === 'mariadb') {
      // MySQL 8.0.16+ supports CHECK constraints with REGEXP
      const mysqlVersion = await getMySQLVersion(queryInterface, transaction);
      
      if (mysqlVersion && mysqlVersion >= 80016) {
        await queryInterface.sequelize.query(`
          ALTER TABLE ${tableName}
          ADD CONSTRAINT check_${columnName}_format
          CHECK (${columnName} REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$');
        `, { transaction });
      } else {
        console.log('MySQL/MariaDB: Email validation will be handled at application level for versions < 8.0.16');
      }
    } else {
      console.log(`Dialect '${dialect}': Email validation will be handled at application level`);
    }
    
    return true;
  } catch (error) {
    console.error(`Error adding email validation constraint to ${tableName}.${columnName}: ${error.message}`);
    throw error;
  }
}

/**
 * Adds URL validation constraints to a table for one or more URL fields
 * 
 * This function handles the different regex capabilities across database dialects:
 * - PostgreSQL: Uses full regex pattern matching with ~* operator
 * - SQLite: Uses simplified LIKE pattern and length check
 * - MySQL 8.0.16+: Uses REGEXP for pattern matching
 * - Older MySQL/Other dialects: Logs that validation will be handled at application level
 * 
 * @param {Object} queryInterface - Sequelize QueryInterface
 * @param {string} tableName - Name of the table
 * @param {Array} columnNames - Array of URL column names to validate
 * @param {Object} transaction - Sequelize transaction
 * @returns {Promise} - Resolves when all constraints are added
 */
async function addUrlValidationConstraints(queryInterface, tableName, columnNames, transaction) {
  const dialect = queryInterface.sequelize.getDialect();
  
  try {
    if (dialect === 'postgres') {
      // PostgreSQL has robust regex support
      // Create a constraint for each URL column
      for (const columnName of columnNames) {
        await queryInterface.sequelize.query(`
          ALTER TABLE ${tableName}
          ADD CONSTRAINT check_${columnName}_format
          CHECK (
            ${columnName} IS NULL OR 
            ${columnName} ~* '^https?://[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\\.[a-zA-Z]{2,}(?:\\.[a-zA-Z]{2,})?(?:/[^\\s]*)?$'
          );
        `, { transaction });
      }
    } else if (dialect === 'sqlite') {
      // SQLite has limited regex support but can use LIKE and basic checks
      for (const columnName of columnNames) {
        await queryInterface.sequelize.query(`
          ALTER TABLE ${tableName}
          ADD CONSTRAINT check_${columnName}_format
          CHECK (
            ${columnName} IS NULL OR 
            (${columnName} LIKE 'http://%' OR ${columnName} LIKE 'https://%') AND
            length(${columnName}) >= 10
          );
        `, { transaction });
      }
    } else if (dialect === 'mysql' || dialect === 'mariadb') {
      // MySQL 8.0.16+ supports CHECK constraints with REGEXP
      const mysqlVersion = await getMySQLVersion(queryInterface, transaction);
      
      if (mysqlVersion && mysqlVersion >= 80016) {
        for (const columnName of columnNames) {
          await queryInterface.sequelize.query(`
            ALTER TABLE ${tableName}
            ADD CONSTRAINT check_${columnName}_format
            CHECK (
              ${columnName} IS NULL OR 
              ${columnName} REGEXP '^https?://[a-zA-Z0-9][a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}(/.*)?$'
            );
          `, { transaction });
        }
      } else {
        console.log('MySQL/MariaDB: URL validation will be handled at application level for versions < 8.0.16');
      }
    } else {
      console.log(`Dialect '${dialect}': URL validation will be handled at application level`);
    }
    
    return true;
  } catch (error) {
    console.error(`Error adding URL validation constraints to ${tableName}: ${error.message}`);
    throw error;
  }
}

/**
 * Adds a JSON validation constraint to ensure a column contains valid JSON
 *
 * @param {Object} queryInterface - Sequelize QueryInterface
 * @param {string} tableName - Name of the table
 * @param {string} columnName - Name of the JSON column
 * @param {Object} transaction - Sequelize transaction
 * @returns {Promise} - Resolves when the constraint is added
 */
async function addJsonValidationConstraint(queryInterface, tableName, columnName, transaction) {
  const dialect = queryInterface.sequelize.getDialect();
  
  try {
    if (dialect === 'postgres') {
      // PostgreSQL can directly check if TEXT is valid JSON
      await queryInterface.sequelize.query(`
        ALTER TABLE ${tableName}
        ADD CONSTRAINT check_${columnName}_is_json
        CHECK (${columnName} IS NULL OR ${columnName}::jsonb IS NOT NULL);
      `, { transaction });
    } else if (dialect === 'mysql' || dialect === 'mariadb') {
      // MySQL 8.0.16+ supports CHECK constraints and JSON_VALID function
      const mysqlVersion = await getMySQLVersion(queryInterface, transaction);
      
      if (mysqlVersion && mysqlVersion >= 80016) {
        await queryInterface.sequelize.query(`
          ALTER TABLE ${tableName}
          ADD CONSTRAINT check_${columnName}_is_json
          CHECK (${columnName} IS NULL OR JSON_VALID(${columnName}));
        `, { transaction });
      } else {
        console.log('MySQL/MariaDB: JSON validation will be handled at application level for versions < 8.0.16');
      }
    } else {
      // For SQLite and other dialects, JSON validation will happen at the application level
      console.log(`Dialect '${dialect}': JSON validation will be handled at application level`);
    }
    
    return true;
  } catch (error) {
    console.error(`Error adding JSON validation constraint to ${tableName}.${columnName}: ${error.message}`);
    throw error;
  }
}

/**
 * Adds text search capabilities to specified columns based on database dialect
 * 
 * @param {Object} queryInterface - Sequelize QueryInterface
 * @param {string} tableName - Name of the table
 * @param {Array} columnNames - Array of column names to enable for text search
 * @param {Object} transaction - Sequelize transaction
 * @returns {Promise} - Resolves when text search capabilities are added
 */
async function addTextSearchCapabilities(queryInterface, tableName, columnNames, transaction) {
  const dialect = queryInterface.sequelize.getDialect();
  
  try {
    if (dialect === 'postgres') {
      // For PostgreSQL, create a tsvector index for full text search capabilities
      // First create a GIN index on the specified columns
      const indexName = `idx_${tableName}_text_search`;
      
      if (columnNames.length === 1) {
        // Single column text search index
        await queryInterface.sequelize.query(`
          CREATE INDEX ${indexName} ON ${tableName} USING GIN (to_tsvector('english', ${columnNames[0]}));
        `, { transaction });
      } else {
        // Multi-column text search index
        const tsvectorExpr = columnNames
          .map(col => `coalesce(${col}, '')`)
          .join(" || ' ' || ");
          
        await queryInterface.sequelize.query(`
          CREATE INDEX ${indexName} ON ${tableName} USING GIN (to_tsvector('english', ${tsvectorExpr}));
        `, { transaction });
      }
      
      console.log(`Created PostgreSQL text search index on ${tableName} for columns: ${columnNames.join(', ')}`);
    } else if (dialect === 'mysql' || dialect === 'mariadb') {
      // For MySQL 5.6+, create a FULLTEXT index
      const indexName = `idx_${tableName}_fulltext`;
      await queryInterface.sequelize.query(`
        CREATE FULLTEXT INDEX ${indexName} ON ${tableName} (${columnNames.join(', ')});
      `, { transaction });
      
      console.log(`Created MySQL FULLTEXT index on ${tableName} for columns: ${columnNames.join(', ')}`);
    } else if (dialect === 'sqlite') {
      // SQLite supports FTS5 (Full Text Search) extension, but it requires a separate virtual table
      // This is a more complex implementation that would ideally be handled in application code
      // Here we'll just create regular indexes and log a message
      for (const columnName of columnNames) {
        await queryInterface.addIndex(tableName, [columnName], { 
          name: `idx_${tableName}_${columnName}`,
          transaction
        });
      }
      
      console.log(`SQLite full text search requires FTS5 virtual tables. Created regular indexes as fallback.`);
    } else {
      console.log(`Dialect '${dialect}': Text search capabilities will be implemented at application level`);
    }
    
    return true;
  } catch (error) {
    console.error(`Error adding text search capabilities to ${tableName}: ${error.message}`);
    throw error;
  }
}

/**
 * Adds a state transition validation constraint for status/state columns
 * 
 * This prevents invalid state transitions by ensuring the new status is a valid 
 * next state based on the current status. This is implemented differently per dialect:
 * - PostgreSQL: Uses trigger functions to check transitions
 * - MySQL: Uses trigger functions if MySQL 5.7+ is detected
 * - Other dialects: Logs that validation will be handled at application level
 * 
 * @param {Object} queryInterface - Sequelize QueryInterface
 * @param {string} tableName - Name of the table
 * @param {string} statusColumn - Name of the status/state column
 * @param {Object} validTransitions - Map of current states to arrays of valid next states
 * @param {Object} transaction - Sequelize transaction
 * @returns {Promise} - Resolves when transition validation is added
 */
async function addStateTransitionValidation(queryInterface, tableName, statusColumn, validTransitions, transaction) {
  const dialect = queryInterface.sequelize.getDialect();
  
  try {
    if (dialect === 'postgres') {
      // For PostgreSQL, create a trigger function to validate state transitions
      
      // First, convert the validTransitions object to a format usable in SQL
      const transitionsArray = Object.entries(validTransitions)
        .map(([fromState, toStates]) => {
          return `('${fromState}', ARRAY[${toStates.map(s => `'${s}'`).join(', ')}])`;
        })
        .join(',\n      ');
      
      // Create the transition validation function
      await queryInterface.sequelize.query(`
        CREATE OR REPLACE FUNCTION validate_${tableName}_${statusColumn}_transition()
        RETURNS TRIGGER AS $$
        DECLARE
          transitions jsonb;
          valid_next_states text[];
        BEGIN
          -- Skip validation for new records (only validate updates)
          IF (TG_OP = 'INSERT') THEN
            RETURN NEW;
          END IF;
          
          -- Skip validation if status hasn't changed
          IF (OLD.${statusColumn} = NEW.${statusColumn}) THEN
            RETURN NEW;
          END IF;
          
          -- Define valid transitions
          transitions := jsonb_build_object(
            ${Object.entries(validTransitions)
              .map(([fromState, toStates]) => 
                `'${fromState}', jsonb_build_array(${toStates.map(s => `'${s}'`).join(', ')})`)
              .join(',\n            ')}
          );
          
          -- Get valid next states for the current state
          IF NOT transitions ? OLD.${statusColumn}::text THEN
            RAISE EXCEPTION 'Invalid current state: %', OLD.${statusColumn};
          END IF;
          
          valid_next_states := ARRAY(
            SELECT jsonb_array_elements_text(transitions->OLD.${statusColumn}::text)
          );
          
          -- Check if the new state is a valid transition
          IF NOT NEW.${statusColumn}::text = ANY(valid_next_states) THEN
            RAISE EXCEPTION 'Invalid state transition from % to %', 
              OLD.${statusColumn}, NEW.${statusColumn};
          END IF;
          
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `, { transaction });
      
      // Create the trigger
      await queryInterface.sequelize.query(`
        CREATE TRIGGER tr_${tableName}_${statusColumn}_transition
        BEFORE UPDATE ON ${tableName}
        FOR EACH ROW
        EXECUTE FUNCTION validate_${tableName}_${statusColumn}_transition();
      `, { transaction });
      
      console.log(`Created PostgreSQL state transition validation for ${tableName}.${statusColumn}`);
    } else if (dialect === 'mysql' || dialect === 'mariadb') {
      // For MySQL 5.7+, create a similar trigger with JSON functions
      const mysqlVersion = await getMySQLVersion(queryInterface, transaction);
      
      if (mysqlVersion && mysqlVersion >= 50700) {
        // Build a JSON string representing valid transitions
        const transitionsJson = JSON.stringify(validTransitions);
        
        // Create the trigger with JSON functions
        await queryInterface.sequelize.query(`
          CREATE TRIGGER tr_${tableName}_${statusColumn}_transition
          BEFORE UPDATE ON ${tableName}
          FOR EACH ROW
          BEGIN
            DECLARE transitions JSON DEFAULT '${transitionsJson}';
            DECLARE valid_transitions JSON;
            
            -- Skip validation if status hasn't changed
            IF OLD.${statusColumn} = NEW.${statusColumn} THEN
              SET NEW.${statusColumn} = NEW.${statusColumn};
            ELSE
              -- Get valid transitions for the current state
              SET valid_transitions = JSON_EXTRACT(transitions, CONCAT('$.', OLD.${statusColumn}));
              
              -- Check if the new state is valid
              IF NOT JSON_CONTAINS(valid_transitions, JSON_QUOTE(NEW.${statusColumn})) THEN
                SIGNAL SQLSTATE '45000' 
                SET MESSAGE_TEXT = CONCAT('Invalid state transition from ', 
                  OLD.${statusColumn}, ' to ', NEW.${statusColumn});
              END IF;
            END IF;
          END;
        `, { transaction });
        
        console.log(`Created MySQL state transition validation for ${tableName}.${statusColumn}`);
      } else {
        console.log('MySQL/MariaDB: State transition validation will be handled at application level for versions < 5.7');
      }
    } else {
      console.log(`Dialect '${dialect}': State transition validation will be handled at application level`);
    }
    
    return true;
  } catch (error) {
    console.error(`Error adding state transition validation to ${tableName}.${statusColumn}: ${error.message}`);
    throw error;
  }
}

/**
 * Drops state transition validation (triggers/functions) when reverting migrations
 * 
 * @param {Object} queryInterface - Sequelize QueryInterface
 * @param {string} tableName - Name of the table
 * @param {string} statusColumn - Name of the status/state column
 * @param {Object} transaction - Sequelize transaction
 * @returns {Promise} - Resolves when transition validation is removed
 */
async function dropStateTransitionValidation(queryInterface, tableName, statusColumn, transaction) {
  const dialect = queryInterface.sequelize.getDialect();
  
  try {
    if (dialect === 'postgres') {
      // Drop the trigger first
      await queryInterface.sequelize.query(`
        DROP TRIGGER IF EXISTS tr_${tableName}_${statusColumn}_transition ON ${tableName};
      `, { transaction });
      
      // Then drop the function
      await queryInterface.sequelize.query(`
        DROP FUNCTION IF EXISTS validate_${tableName}_${statusColumn}_transition();
      `, { transaction });
      
      console.log(`Dropped PostgreSQL state transition validation for ${tableName}.${statusColumn}`);
    } else if (dialect === 'mysql' || dialect === 'mariadb') {
      // Drop the MySQL trigger
      await queryInterface.sequelize.query(`
        DROP TRIGGER IF EXISTS tr_${tableName}_${statusColumn}_transition;
      `, { transaction });
      
      console.log(`Dropped MySQL state transition validation for ${tableName}.${statusColumn}`);
    }
    
    return true;
  } catch (error) {
    console.error(`Error dropping state transition validation for ${tableName}.${statusColumn}: ${error.message}`);
    throw error;
  }
}

/**
 * Wraps a migration in a transaction with proper error handling
 * 
 * @param {Object} queryInterface - Sequelize QueryInterface
 * @param {Function} migrationFunc - The migration function to execute
 * @returns {Promise} - Resolves when migration completes
 */
async function withTransaction(queryInterface, migrationFunc) {
  const transaction = await queryInterface.sequelize.transaction();
  try {
    await migrationFunc(transaction);
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

/**
 * Optimizes index creation by checking for existing indexes and constraints
 * 
 * @param {Object} queryInterface - Sequelize QueryInterface
 * @param {string} tableName - Name of the table
 * @param {Object} indexDefinitions - Map of index definitions
 * @param {Object} transaction - Sequelize transaction
 * @returns {Promise} - Resolves when indexes are optimized
 */
async function optimizeIndexes(queryInterface, tableName, indexDefinitions, transaction) {
  const dialect = queryInterface.sequelize.getDialect();
  const existingIndexes = await queryInterface.showIndex(tableName, { transaction });
  
  for (const [indexName, definition] of Object.entries(indexDefinitions)) {
    // Skip if index already exists through a constraint
    const existingIndex = existingIndexes.find(idx => 
      idx.name === indexName || 
      (idx.unique && idx.fields.every(f => definition.fields.includes(f.attribute)))
    );
    
    if (!existingIndex) {
      await queryInterface.addIndex(tableName, {
        ...definition,
        name: indexName
      }, { transaction });
    }
  }
}

/**
 * Adds IP address validation constraint
 * 
 * @param {Object} queryInterface - Sequelize QueryInterface
 * @param {string} tableName - Name of the table
 * @param {string} columnName - Name of the IP address column
 * @param {Object} transaction - Sequelize transaction
 * @returns {Promise} - Resolves when constraint is added
 */
async function addIpAddressValidation(queryInterface, tableName, columnName, transaction) {
  const dialect = queryInterface.sequelize.getDialect();
  const constraintName = `${tableName}_${columnName}_ip_validation`;
  
  let constraintDefinition;
  if (dialect === 'postgres') {
    // PostgreSQL supports INET type natively
    await queryInterface.sequelize.query(
      `ALTER TABLE "${tableName}" ALTER COLUMN "${columnName}" TYPE INET USING "${columnName}"::INET;`,
      { transaction }
    );
  } else {
    // For other dialects, use regex validation
    const ipv4Regex = '^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$';
    const ipv6Regex = '^(?:(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,7}:|(?:[0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,5}(?::[0-9a-fA-F]{1,4}){1,2}|(?:[0-9a-fA-F]{1,4}:){1,4}(?::[0-9a-fA-F]{1,4}){1,3}|(?:[0-9a-fA-F]{1,4}:){1,3}(?::[0-9a-fA-F]{1,4}){1,4}|(?:[0-9a-fA-F]{1,4}:){1,2}(?::[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:(?:(?::[0-9a-fA-F]{1,4}){1,6})|:(?:(?::[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(?::[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(?:ffff(?::0{1,4}){0,1}:){0,1}(?:(?:25[0-5]|(?:2[0-4]|1{0,1}[0-9]){0,1}[0-9])\\.){3,3}(?:25[0-5]|(?:2[0-4]|1{0,1}[0-9]){0,1}[0-9])|(?:[0-9a-fA-F]{1,4}:){1,4}:(?:(?:25[0-5]|(?:2[0-4]|1{0,1}[0-9]){0,1}[0-9])\\.){3,3}(?:25[0-5]|(?:2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$';
    
    constraintDefinition = `${columnName} REGEXP '${ipv4Regex}' OR ${columnName} REGEXP '${ipv6Regex}'`;
    await addConstraints(queryInterface, tableName, {
      [constraintName]: constraintDefinition
    }, transaction);
  }
}

/**
 * Adds table partitioning for PostgreSQL
 * 
 * @param {Object} queryInterface - Sequelize QueryInterface
 * @param {string} tableName - Name of the table to partition
 * @param {Object} partitionConfig - Partitioning configuration
 * @param {string} partitionConfig.column - Column or expression to partition on
 * @param {string} partitionConfig.type - Partition type: 'range', 'list', or 'hash'
 * @param {Array} partitionConfig.parts - Partition definitions (for range and list)
 * @param {number} partitionConfig.numPartitions - Number of partitions (for hash)
 * @param {Object} partitionConfig.subPartition - Optional sub-partitioning configuration
 * @param {Object} transaction - Sequelize transaction
 * @returns {Promise} - Resolves when partitioning is complete
 * @throws {Error} - If partitioning configuration is invalid
 */
async function addTablePartitioning(queryInterface, tableName, partitionConfig, transaction) {
  // Input validation
  if (!tableName || typeof tableName !== 'string') {
    throw new Error('Invalid table name');
  }

  if (!partitionConfig || !partitionConfig.column || !partitionConfig.type) {
    throw new Error('Invalid partition configuration');
  }

  const validTypes = ['range', 'list', 'hash'];
  if (!validTypes.includes(partitionConfig.type)) {
    throw new Error(`Invalid partition type. Must be one of: ${validTypes.join(', ')}`);
  }

  // Sanitize identifiers to prevent SQL injection
  const sanitizedTableName = queryInterface.sequelize.escape(tableName).replace(/'/g, '"');
  const sanitizedColumn = partitionConfig.column.split(',')
    .map(col => queryInterface.sequelize.escape(col.trim()).replace(/'/g, '"'))
    .join(', ');

  try {
    // Create the partitioned table
    if (partitionConfig.type === 'range') {
      await queryInterface.sequelize.query(
        `ALTER TABLE ${sanitizedTableName} PARTITION BY RANGE (${sanitizedColumn});`,
        { transaction }
      );

      // Validate and create range partitions
      if (!Array.isArray(partitionConfig.parts) || partitionConfig.parts.length === 0) {
        throw new Error('Range partitioning requires at least one partition definition');
      }

      for (const part of partitionConfig.parts) {
        if (!part.name || !part.from || !part.to) {
          throw new Error('Invalid range partition definition');
        }

        const partName = queryInterface.sequelize.escape(`${tableName}_${part.name}`).replace(/'/g, '"');
        
        // Create the partition
        await queryInterface.sequelize.query(
          `CREATE TABLE ${partName} PARTITION OF ${sanitizedTableName}
           FOR VALUES FROM (${part.from}) TO (${part.to});`,
          { transaction }
        );

        // Handle sub-partitioning if configured
        if (partitionConfig.subPartition) {
          await createSubPartition(queryInterface, partName, partitionConfig.subPartition, transaction);
        }
      }
    } else if (partitionConfig.type === 'list') {
      await queryInterface.sequelize.query(
        `ALTER TABLE ${sanitizedTableName} PARTITION BY LIST (${sanitizedColumn});`,
        { transaction }
      );

      // Validate and create list partitions
      if (!Array.isArray(partitionConfig.parts) || partitionConfig.parts.length === 0) {
        throw new Error('List partitioning requires at least one partition definition');
      }

      for (const part of partitionConfig.parts) {
        if (!part.name || !Array.isArray(part.values) || part.values.length === 0) {
          throw new Error('Invalid list partition definition');
        }

        const partName = queryInterface.sequelize.escape(`${tableName}_${part.name}`).replace(/'/g, '"');
        const values = part.values.map(v => queryInterface.sequelize.escape(v)).join(', ');

        // Create the partition
        await queryInterface.sequelize.query(
          `CREATE TABLE ${partName} PARTITION OF ${sanitizedTableName}
           FOR VALUES IN (${values});`,
          { transaction }
        );

        // Handle sub-partitioning if configured
        if (partitionConfig.subPartition) {
          await createSubPartition(queryInterface, partName, partitionConfig.subPartition, transaction);
        }
      }
    } else if (partitionConfig.type === 'hash') {
      // Validate hash partitioning config
      if (!partitionConfig.numPartitions || partitionConfig.numPartitions < 2) {
        throw new Error('Hash partitioning requires at least 2 partitions');
      }

      await queryInterface.sequelize.query(
        `ALTER TABLE ${sanitizedTableName} PARTITION BY HASH (${sanitizedColumn});`,
        { transaction }
      );

      // Create hash partitions
      for (let i = 0; i < partitionConfig.numPartitions; i++) {
        const partName = queryInterface.sequelize.escape(`${tableName}_p${i}`).replace(/'/g, '"');
        
        await queryInterface.sequelize.query(
          `CREATE TABLE ${partName} PARTITION OF ${sanitizedTableName}
           FOR VALUES WITH (modulus ${partitionConfig.numPartitions}, remainder ${i});`,
          { transaction }
        );
      }
    }

    // Create indexes on partitioned table if specified
    if (partitionConfig.indexes) {
      for (const indexDef of partitionConfig.indexes) {
        await queryInterface.addIndex(tableName, indexDef.columns, {
          ...indexDef,
          transaction
        });
      }
    }

  } catch (error) {
    throw new Error(`Failed to create partitioned table: ${error.message}`);
  }
}

/**
 * Helper function to create sub-partitions
 */
async function createSubPartition(queryInterface, parentPartition, subConfig, transaction) {
  if (!subConfig.type || !subConfig.column) {
    throw new Error('Invalid sub-partition configuration');
  }

  const sanitizedParentPartition = queryInterface.sequelize.escape(parentPartition).replace(/'/g, '"');
  const sanitizedColumn = queryInterface.sequelize.escape(subConfig.column).replace(/'/g, '"');

  if (subConfig.type === 'range') {
    for (const part of subConfig.parts) {
      const subPartName = queryInterface.sequelize.escape(`${parentPartition}_${part.name}`).replace(/'/g, '"');
      await queryInterface.sequelize.query(
        `CREATE TABLE ${subPartName} PARTITION OF ${sanitizedParentPartition}
         FOR VALUES FROM (${part.from}) TO (${part.to});`,
        { transaction }
      );
    }
  } else if (subConfig.type === 'list') {
    for (const part of subConfig.parts) {
      const subPartName = queryInterface.sequelize.escape(`${parentPartition}_${part.name}`).replace(/'/g, '"');
      const values = part.values.map(v => queryInterface.sequelize.escape(v)).join(', ');
      await queryInterface.sequelize.query(
        `CREATE TABLE ${subPartName} PARTITION OF ${sanitizedParentPartition}
         FOR VALUES IN (${values});`,
        { transaction }
      );
    }
  } else if (subConfig.type === 'hash') {
    for (let i = 0; i < subConfig.numPartitions; i++) {
      const subPartName = queryInterface.sequelize.escape(`${parentPartition}_p${i}`).replace(/'/g, '"');
      await queryInterface.sequelize.query(
        `CREATE TABLE ${subPartName} PARTITION OF ${sanitizedParentPartition}
         FOR VALUES WITH (modulus ${subConfig.numPartitions}, remainder ${i});`,
        { transaction }
      );
    }
  }
}

/**
 * Adds a unique constraint with soft delete consideration
 * 
 * @param {Object} queryInterface - Sequelize QueryInterface
 * @param {string} tableName - Name of the table
 * @param {Array} columns - Array of column names to make unique
 * @param {string} constraintName - Name of the constraint
 * @param {Object} transaction - Sequelize transaction
 * @returns {Promise} - Resolves when constraint is added
 */
async function addSoftDeleteUniqueConstraint(queryInterface, tableName, columns, constraintName, transaction) {
  const dialect = queryInterface.sequelize.getDialect();
  
  try {
    if (dialect === 'postgres') {
      // PostgreSQL supports partial unique indexes
      await queryInterface.addIndex(tableName, columns, {
        name: constraintName,
        unique: true,
        where: {
          deleted_at: null
        },
        transaction
      });
    } else if (dialect === 'mysql' || dialect === 'mariadb') {
      // MySQL/MariaDB - Create a unique index and handle soft delete in application
      await queryInterface.addIndex(tableName, columns, {
        name: constraintName,
        unique: true,
        transaction
      });
    } else {
      // For other dialects, create a regular unique index
      await queryInterface.addIndex(tableName, columns, {
        name: constraintName,
        unique: true,
        transaction
      });
    }
  } catch (error) {
    console.error(`Error adding soft delete unique constraint: ${error.message}`);
    throw error;
  }
}

/**
 * Adds a foreign key constraint with proper indexing
 * 
 * @param {Object} queryInterface - Sequelize QueryInterface
 * @param {string} tableName - Name of the table
 * @param {string} columnName - Name of the foreign key column
 * @param {Object} referenceConfig - Reference configuration
 * @param {Object} transaction - Sequelize transaction
 * @returns {Promise} - Resolves when constraint and index are added
 */
async function addForeignKeyWithIndex(queryInterface, tableName, columnName, referenceConfig, transaction) {
  try {
    // Add the foreign key constraint
    await queryInterface.addConstraint(tableName, {
      fields: [columnName],
      type: 'foreign key',
      name: `fk_${tableName}_${columnName}`,
      references: {
        table: referenceConfig.model,
        field: referenceConfig.key
      },
      onDelete: referenceConfig.onDelete || 'NO ACTION',
      onUpdate: referenceConfig.onUpdate || 'CASCADE',
      transaction
    });

    // Add an index on the foreign key column
    await queryInterface.addIndex(tableName, [columnName], {
      name: `idx_${tableName}_${columnName}`,
      transaction
    });
  } catch (error) {
    console.error(`Error adding foreign key with index: ${error.message}`);
    throw error;
  }
}

/**
 * Adds timestamp columns (created_at, updated_at, deleted_at) to a table
 * 
 * @param {Object} queryInterface - Sequelize QueryInterface
 * @param {string} tableName - Name of the table
 * @param {Object} options - Configuration options
 * @param {Object} transaction - Sequelize transaction
 * @returns {Promise} - Resolves when columns are added
 */
async function addTimestampColumns(queryInterface, tableName, options = {}, transaction) {
  const timestamps = {
    created_at: {
      type: 'TIMESTAMP',
      allowNull: false,
      defaultValue: queryInterface.sequelize.literal('CURRENT_TIMESTAMP')
    },
    updated_at: {
      type: 'TIMESTAMP',
      allowNull: false,
      defaultValue: queryInterface.sequelize.literal('CURRENT_TIMESTAMP')
    }
  };

  if (options.softDelete) {
    timestamps.deleted_at = {
      type: 'TIMESTAMP',
      allowNull: true
    };
  }

  try {
    for (const [columnName, definition] of Object.entries(timestamps)) {
      await queryInterface.addColumn(tableName, columnName, definition, { transaction });
    }

    if (options.softDelete) {
      await queryInterface.addIndex(tableName, ['deleted_at'], {
        name: `idx_${tableName}_deleted_at`,
        transaction
      });
    }
  } catch (error) {
    console.error(`Error adding timestamp columns: ${error.message}`);
    throw error;
  }
}

/**
 * Adds standard length constraints for common column types
 * 
 * @param {Object} queryInterface - Sequelize QueryInterface
 * @param {string} tableName - Name of the table
 * @param {Object} columnConfigs - Configuration for each column
 * @param {Object} transaction - Sequelize transaction
 * @returns {Promise} - Resolves when constraints are added
 */
async function addStandardLengthConstraints(queryInterface, tableName, columnConfigs, transaction) {
  const constraints = {};
  
  for (const [columnName, config] of Object.entries(columnConfigs)) {
    if (config.type === 'name') {
      constraints[`chk_${tableName}_${columnName}_length`] = 
        `char_length(${columnName}) >= 2 AND char_length(${columnName}) <= 100`;
    } else if (config.type === 'title') {
      constraints[`chk_${tableName}_${columnName}_length`] = 
        `char_length(${columnName}) >= 3 AND char_length(${columnName}) <= 200`;
    } else if (config.type === 'description') {
      constraints[`chk_${tableName}_${columnName}_length`] = 
        `char_length(${columnName}) >= 10`;
    } else if (config.type === 'slug') {
      constraints[`chk_${tableName}_${columnName}_format`] = 
        `${columnName} ~* '^[a-z0-9]+(?:-[a-z0-9]+)*$'`;
    }
  }

  await addConstraints(queryInterface, tableName, constraints, transaction);
}

/**
 * Adds metadata JSON column with validation
 * 
 * @param {Object} queryInterface - Sequelize QueryInterface
 * @param {string} tableName - Name of the table
 * @param {string} columnName - Name of the metadata column
 * @param {Object} transaction - Sequelize transaction
 * @returns {Promise} - Resolves when column is added with validation
 */
async function addMetadataColumn(queryInterface, tableName, columnName = 'metadata', transaction) {
  const dialect = queryInterface.sequelize.getDialect();
  
  try {
    if (dialect === 'postgres') {
      await queryInterface.addColumn(tableName, columnName, {
        type: 'JSONB',
        defaultValue: {},
        allowNull: false
      }, { transaction });
    } else {
      // For other dialects, use TEXT/JSON type
      await queryInterface.addColumn(tableName, columnName, {
        type: 'TEXT',
        defaultValue: '{}',
        allowNull: false
      }, { transaction });
    }

    // Add JSON validation
    await addJsonValidationConstraint(queryInterface, tableName, columnName, transaction);
  } catch (error) {
    console.error(`Error adding metadata column: ${error.message}`);
    throw error;
  }
}

// Export new utility functions
module.exports = {
  createEnumTypes,
  dropEnumTypes,
  addConstraints,
  addEmailValidationConstraint,
  addUrlValidationConstraints,
  addJsonValidationConstraint,
  addTextSearchCapabilities,
  addStateTransitionValidation,
  dropStateTransitionValidation,
  withTransaction,
  optimizeIndexes,
  addIpAddressValidation,
  addTablePartitioning,
  addSoftDeleteUniqueConstraint,
  addForeignKeyWithIndex,
  addTimestampColumns,
  addStandardLengthConstraints,
  addMetadataColumn
}; 