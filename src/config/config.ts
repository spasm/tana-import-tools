import Conf from "conf";
const properties = ['imageUploadBaseUrl'];

const configAction = process.argv[2];
const configEntry = process.argv[3];
const config = new Conf();

function listConfig() {
    console.log(`Listing all available properties:`);
    properties.forEach(prop => console.log(`- ${prop} -`));
}

switch (configAction) {
    case 'set': {
        setConfig();
        break;
    }
    case 'get': {
        getConfig();
        break;
    }
    case 'list': {
        listConfig();
        break;
    }
    default: {
        throw Error(`Invalid action, must be either 'set', 'get', or 'list'.`);
    }
}

function setConfig() {
    // accept an entry of property:value

    const configEntrySplit = configEntry.split('|');
    if(configEntrySplit?.length !== 2) { throw Error(`Config entry is in the wrong format.  Use "Property|Value"`); }

    const [prop, value] = configEntrySplit;
    if(!isValidProperty(prop)) { throw Error(`Property ${prop} not valid.`); }

    console.log(`Setting property: ${prop} to: ${value}`);

    config.set(prop, value);

    console.log(`Property set!`);
}

// Is really just looking for the name of the property
 function getConfig() {
    if(!isValidProperty(configEntry)) { throw Error(`Property ${configEntry} not valid.`); }
    if(!config.has(configEntry)) { console.log(`Property ${configEntry} not set.`); }

    console.log(`Property ${configEntry}'s value: ${config.get(configEntry)}`);
 }

 function isValidProperty(name: string) {
    return properties.includes(name);
 }