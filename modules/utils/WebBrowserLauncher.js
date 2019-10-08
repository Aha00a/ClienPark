const os = require('os');
const { exec } = require('child_process');

function execute(s) {
    console.log(`exec\t${s}`);
    exec(s);
}

module.exports = {
    isSupportedPlatform: () => "win32,darwin".split(',').includes(os.platform()),
    launch: v => {
        switch (os.platform()) {
            case 'win32':
                execute(`start "" "${v}"`);
                return true;
            case 'darwin':
                execute(`open "${v}"`);
                return true;
        }
        return false;
    }
};
