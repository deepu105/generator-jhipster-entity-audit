import { existsSync } from 'fs';
import { TEMPLATES_WEBAPP_SOURCES_DIR } from 'generator-jhipster';
import BaseApplicationGenerator from 'generator-jhipster/generators/base-application';

export default class extends BaseApplicationGenerator {
  constructor(args, opts, features) {
    super(args, opts, { ...features, sbsBlueprint: true });
  }

  async _postConstruct() {
    await this.dependsOnJHipster('bootstrap-application');
  }

  get [BaseApplicationGenerator.WRITING]() {
    return this.asWritingTaskGroup({
      async writingTemplateTask({ application: { languages = [], clientSrcDir } }) {
        if (!clientSrcDir) {
          throw new Error('clientSrcDir is missing');
        }
        const templates = languages.map(language => {
          const sourceLanguage = existsSync(`${this.templatePath()}/${TEMPLATES_WEBAPP_SOURCES_DIR}i18n/${language}/entity-audit.json`)
            ? language
            : 'en';
          return {
            file: `${TEMPLATES_WEBAPP_SOURCES_DIR}i18n/${sourceLanguage}/entity-audit.json`,
            renameTo: `${clientSrcDir}i18n/${language}/entity-audit.json`,
            noEjs: true,
          };
        });
        if (templates.length > 0) {
          await this.writeFiles({
            sections: {
              customAudit: [
                {
                  templates,
                },
              ],
            },
            context: this,
          });
        }
      },
    });
  }
}
