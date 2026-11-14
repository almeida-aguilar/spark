const path = require('path');
const test = require('tap').test;
const makeTestStorage = require('../fixtures/make-test-storage');
const readFileToBuffer = require('../fixtures/readProjectFile').readFileToBuffer;
const VirtualMachine = require('../../src/index');

const projectUri = path.resolve(__dirname, '../fixtures/unsupported_extension.sb3');
const project = readFileToBuffer(projectUri);

test('loading a project with blocks of an unsupported extension', t => {
    t.plan(4);
    const vm = new VirtualMachine();
    vm.attachStorage(makeTestStorage());

    vm.loadProject(project)
        .then(() => {
            t.equal(vm.runtime.targets.length, 2, 'the project is loaded');

            const sprite = vm.runtime.targets[1];
            const blockIDs = Object.keys(sprite.blocks._blocks);

            t.ok(
                blockIDs.indexOf('mb1') === -1 && blockIDs.indexOf('mb2') === -1,
                'the blocks of the unsupported extension are not created'
            );
            t.ok(blockIDs.indexOf('core1') !== -1, 'the blocks of supported extensions are created');

            t.same(
                vm.runtime.unsupportedExtensions,
                ['microbit'],
                'the unsupported extension is reported to the interface'
            );
        })
        .catch(err => {
            t.fail(`the project should load without errors: ${err}`);
        });
});
