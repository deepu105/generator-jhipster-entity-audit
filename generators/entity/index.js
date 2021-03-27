const chalk = require('chalk');
const BaseGenerator = require('generator-jhipster/generators/generator-base');
const jhipsterConstants = require('generator-jhipster/generators/generator-constants');

const genUtils = require('../utils');
const packagejs = require('../../package.json');

module.exports = class extends BaseGenerator {
  get initializing() {
    return {
      readConfig() {
        // read JHipster config
        this.loadAppConfig();
        this.loadClientConfig();
        this.loadServerConfig();
        this.loadTranslationConfig();
        // load entity config
        this.entityConfig = this.options.entityConfig;
      },
      setSource() {
        this.sourceRoot(`${this.sourceRoot()}/../../app/templates`);
      },
      checkDBType() {
        if (this.databaseType !== 'sql' && this.databaseType !== 'mongodb') {
          // exit if DB type is not SQL or MongoDB
          this.abort = true;
        }
      },

      displayLogo() {
        if (this.abort) {
          return;
        }
        this.log(chalk.white(`Running ${chalk.bold('JHipster Entity Audit')} Generator! ${chalk.yellow(`v${packagejs.version}\n`)}`));
      },

      validate() {
        // this shouldnt be run directly
        if (!this.entityConfig) {
          this.env.error(`${chalk.red.bold('ERROR!')} This sub generator should be used only from JHipster and cannot be run directly...\n`);
        }
      },

      getAuditedEntities() {
        this.auditedEntities = this.getExistingEntities()
          .filter(entity => entity.definition.enableEntityAudit)
          .map(entity => entity.name);
      }
    };
  }

  prompting() {
    if (this.abort) {
      return;
    }

    // don't prompt if data are imported from a file
    if (this.entityConfig.useConfigurationFile === true && typeof this.entityConfig.enableEntityAudit !== 'undefined') {
      this.enableAudit = this.entityConfig.enableEntityAudit;

      if (typeof this.config.get('auditFramework') !== 'undefined') {
        this.auditFramework = this.config.get('auditFramework');
      } else {
        this.auditFramework = 'custom';
      }
      return;
    }

    const done = this.async();
    const entityName = this.entityConfig.entityClass;
    const prompts = [{
      type: 'confirm',
      name: 'enableAudit',
      message: `Do you want to enable audit for this entity(${entityName})?`,
      default: true
    }];

    this.prompt(prompts).then((props) => {
      this.props = props;
      // To access props later use this.props.someOption;
      this.enableAudit = props.enableAudit;
      this.auditFramework = this.config.get('auditFramework');
      if (this.enableAudit && !this.auditedEntities.includes(entityName)) {
        this.auditedEntities.push(entityName);
      }
      done();
    });
  }
  get writing() {
    return {

      updateFiles() {
        if (this.abort) {
          return;
        }
        if (!this.enableAudit) {
          return;
        }

        // use constants from generator-constants.js
        const javaDir = `${jhipsterConstants.SERVER_MAIN_SRC_DIR + this.packageFolder}/`;
        const resourceDir = jhipsterConstants.SERVER_MAIN_RES_DIR;
        this.javaTemplateDir = 'src/main/java/package';

        if (this.entityConfig.entityClass) {
          this.log(`\n${chalk.bold.green('I\'m updating the entity for audit ')}${chalk.bold.yellow(this.entityConfig.entityClass)}`);

          const entityName = this.entityConfig.entityClass;
          this.changelogDate = this.entityConfig.changelogDate || this.dateFormatForLiquibase();
          if (!this.skipServer) {
            genUtils.updateEntityAudit.call(this, entityName, this.entityConfig, javaDir, resourceDir, true, this.skipFakeData);
          }
        }
      },
      updateConfig() {
        if (this.abort) {
          return;
        }
        this.updateEntityConfig(this.entityConfig.filename, 'enableEntityAudit', this.enableAudit);
      }
    };
  }

  end() {
    if (this.abort) {
      return;
    }
    if (this.enableAudit) {
      this.log(`\n${chalk.bold.green('Entity audit enabled')}`);
    }
  }
};
