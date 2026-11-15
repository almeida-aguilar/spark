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

    test('keeps at most three rotating snapshots per project, newest first', async () => {
        const store = new LocalProjectStore();
        const now = jest.spyOn(Date, 'now');
        now.mockReturnValue(1000);

        await store.saveSnapshot('project-1', {version: 1}, 'One');
        now.mockReturnValue(2000);
        await store.saveSnapshot('project-1', {version: 2}, 'Two');
        now.mockReturnValue(3000);
        await store.saveSnapshot('project-1', {version: 3}, 'Three');
        now.mockReturnValue(4000);
        await store.saveSnapshot('project-1', {version: 4}, 'Four');
        now.mockReturnValue(5000);
        await store.saveSnapshot('project-1', {version: 5}, 'Five');

        const snapshots = await store.listSnapshots('project-1');
        expect(snapshots.length).toBe(3);
        expect(snapshots.map(entry => entry.projectData.version)).toEqual([5, 4, 3]);

        now.mockRestore();
    });

    test('snapshots are per project', async () => {
        const store = new LocalProjectStore();

        await store.saveSnapshot('project-1', {version: 1});
        await store.saveSnapshot('project-2', {version: 2});

        expect((await store.listSnapshots('project-1')).length).toBe(1);
        expect((await store.listSnapshots('project-2')).length).toBe(1);
    });

    test('removing a project removes its snapshots', async () => {
        const store = new LocalProjectStore();

        await store.saveSnapshot('project-1', {version: 1});
        await store.saveSnapshot('project-2', {version: 2});
        await store.remove('project-1');

        expect((await store.listSnapshots('project-1')).length).toBe(0);
        expect((await store.listSnapshots('project-2')).length).toBe(1);
    });
});
