import LocalProjectStore from '../../../src/lib/project-store-local';

describe('LocalProjectStore', () => {
    test('saves and loads a project', async () => {
        const store = new LocalProjectStore();
        const project = {targets: [], meta: {semver: '3.0.0'}};

        await store.save('project-1', project, 'My project');
        const loaded = await store.load('project-1');

        expect(loaded).toEqual(project);
    });

    test('returns null when the project does not exist', async () => {
        const store = new LocalProjectStore();

        expect(await store.load('does-not-exist')).toBeNull();
    });

    test('lists the saved projects', async () => {
        const store = new LocalProjectStore();

        await store.save('project-1', {targets: []}, 'First');
        await store.save('project-2', {targets: []}, 'Second');
        const list = await store.list();

        expect(list.length).toBe(2);
        expect(list.map(entry => entry.id).sort()).toEqual(['project-1', 'project-2']);
        expect(list.find(entry => entry.id === 'project-1').title).toBe('First');
    });

    test('removes a project', async () => {
        const store = new LocalProjectStore();

        await store.save('project-1', {targets: []});
        await store.remove('project-1');

        expect(await store.load('project-1')).toBeNull();
        expect((await store.list()).length).toBe(0);
    });
});
