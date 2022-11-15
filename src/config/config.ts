import Conf from "conf";

// Master properties list for now, will come up with a better arrangement later
/////////////////////////////////////////////
const properties = ['imageUploadBaseUrl', 'debugLogging'];
/////////////////////////////////////////////

const configAction = process.argv[2];
const configEntry = process.argv[3];
const config = new Conf();

switch (configAction) {
    case 'set': {
        setProp();
        break;
    }
    case 'get': {
        getProp();
        break;
    }
    case 'getall': {
        getAllProps();
        break;
    }
    case 'list': {
        listProps();
        break;
    }
    default: {
        throw Error(`Invalid action, must be either 'set', 'get', or 'list'.`);
    }
}

function getAllProps() {
    console.log(`Listing all set properties and their values:`);
    properties.forEach(prop => {
       console.log(`Property: ${prop}, Value: ${config.get(prop)}`);
    });
}

function listProps() {
    console.log(`Listing all available properties:`);
    properties.forEach(prop => console.log(`- ${prop} -`));
}

function setProp() {
    const configEntrySplit = configEntry.split('|');
    if(configEntrySplit?.length !== 2) { throw Error(`Config entry is in the wrong format.  Use "Property|Value"`); }

    const [prop, value] = configEntrySplit;
    if(!isValidProperty(prop)) { throw Error(`Property ${prop} not valid.`); }

    console.log(`Setting property: ${prop} to: ${value}`);

    config.set(prop, value);

    console.log(`Property set!`);
}

 function getProp() {
    if(!isValidProperty(configEntry)) { throw Error(`Property ${configEntry} not valid.`); }
    if(!config.has(configEntry)) { console.log(`Property ${configEntry} not set.`); }

    console.log(`Property: ${configEntry}, Value: ${config.get(configEntry)}`);
 }

 function isValidProperty(name: string) {
    return properties.includes(name);
 }