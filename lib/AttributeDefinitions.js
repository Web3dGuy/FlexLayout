import { Attribute } from "./Attribute";
/** @internal */
export class AttributeDefinitions {
    constructor() {
        this.attributes = [];
        this.nameToAttribute = new Map();
    }
    addWithAll(name, modelName, defaultValue, alwaysWriteJson) {
        const attr = new Attribute(name, modelName, defaultValue, alwaysWriteJson);
        this.attributes.push(attr);
        this.nameToAttribute.set(name, attr);
        return attr;
    }
    addInherited(name, modelName) {
        return this.addWithAll(name, modelName, undefined, false);
    }
    add(name, defaultValue, alwaysWriteJson) {
        return this.addWithAll(name, undefined, defaultValue, alwaysWriteJson);
    }
    getAttributes() {
        return this.attributes;
    }
    getModelName(name) {
        const conversion = this.nameToAttribute.get(name);
        if (conversion !== undefined) {
            return conversion.modelName;
        }
        return undefined;
    }
    toJson(jsonObj, obj) {
        for (const attr of this.attributes) {
            const fromValue = obj[attr.name];
            if (attr.alwaysWriteJson || fromValue !== attr.defaultValue) {
                jsonObj[attr.name] = fromValue;
            }
        }
    }
    fromJson(jsonObj, obj) {
        for (const attr of this.attributes) {
            let fromValue = jsonObj[attr.name];
            if (fromValue === undefined && attr.alias) {
                fromValue = jsonObj[attr.alias];
            }
            if (fromValue === undefined) {
                obj[attr.name] = attr.defaultValue;
            }
            else {
                obj[attr.name] = fromValue;
            }
        }
    }
    update(jsonObj, obj) {
        for (const attr of this.attributes) {
            if (jsonObj.hasOwnProperty(attr.name)) {
                const fromValue = jsonObj[attr.name];
                if (fromValue === undefined) {
                    delete obj[attr.name];
                }
                else {
                    obj[attr.name] = fromValue;
                }
            }
        }
    }
    setDefaults(obj) {
        for (const attr of this.attributes) {
            obj[attr.name] = attr.defaultValue;
        }
    }
    pairAttributes(type, childAttributes) {
        for (const attr of childAttributes.attributes) {
            if (attr.modelName && this.nameToAttribute.has(attr.modelName)) {
                const pairedAttr = this.nameToAttribute.get(attr.modelName);
                pairedAttr.setpairedAttr(attr);
                attr.setpairedAttr(pairedAttr);
                pairedAttr.setPairedType(type);
            }
        }
    }
    toTypescriptInterface(name, parentAttributes) {
        var _a, _b;
        const lines = [];
        const sorted = this.attributes.sort((a, b) => a.name.localeCompare(b.name));
        // const sorted = this.attributes;
        lines.push("export interface I" + name + "Attributes {");
        for (let i = 0; i < sorted.length; i++) {
            const c = sorted[i];
            let type = c.type;
            let defaultValue = undefined;
            let attr = c;
            let inherited = undefined;
            if (attr.defaultValue !== undefined) {
                defaultValue = attr.defaultValue;
            }
            else if (attr.modelName !== undefined
                && parentAttributes !== undefined
                && parentAttributes.nameToAttribute.get(attr.modelName) !== undefined) {
                inherited = attr.modelName;
                attr = parentAttributes.nameToAttribute.get(inherited);
                defaultValue = attr.defaultValue;
                type = attr.type;
            }
            let defValue = JSON.stringify(defaultValue);
            const required = attr.required ? "" : "?";
            let sb = "\t/**\n\t  ";
            if (c.description) {
                sb += c.description;
            }
            else if (c.pairedType && ((_a = c.pairedAttr) === null || _a === void 0 ? void 0 : _a.description)) {
                sb += `Value for ${c.pairedType} attribute ${c.pairedAttr.name} if not overridden`;
                sb += "\n\n\t  ";
                sb += (_b = c.pairedAttr) === null || _b === void 0 ? void 0 : _b.description;
            }
            sb += "\n\n\t  ";
            if (c.fixed) {
                sb += `Fixed value: ${defValue}`;
            }
            else if (inherited) {
                sb += `Default: inherited from Global attribute ${c.modelName} (default ${defValue})`;
            }
            else {
                sb += `Default: ${defValue}`;
            }
            sb += "\n\t */";
            lines.push(sb);
            lines.push("\t" + c.name + required + ": " + type + ";\n");
        }
        lines.push("}");
        return lines.join("\n");
    }
}
//# sourceMappingURL=AttributeDefinitions.js.map