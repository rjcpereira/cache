import { writable } from "svelte/store";

const slug = 'js-stored-cache',
    duration = 5e3,
    prefix = '@REQ@';

let cached = {},
    requests = {};

export const toKey = path => !path || !path.includes('//') ? path : path.substr(path.indexOf('//') + 2, path.length);//utils

const put = (target, key, value) => !target || !key ? null : target.update(data => {
    data[key] = value;
    return data;
});

const unset = (target, key) => !target || !key ? null : target.update(data => {
    delete data[key];
    return data;
});

const init = () => {
    if (!window.localStorage) return;
    const saved = window.localStorage.getItem(slug);
    let stored;
    if (saved) try {
        stored = JSON.parse(saved);
    }
        catch (e) { }
    if (stored) {
        requests = {
            ...requests,
            ...(stored.requests || {})
        };
        if (stored.store) for (let key in stored.store) {
            const value = stored.store[key];
            const link = !value || typeof value != 'string' || !value.startsWith(prefix) ? null : value.replace(prefix, '');
            if (link) cached[key] = link;
            stored.store[key] = !link ? value : (!requests[link] ? null : requests[link].data);
            if (!stored.store[key]) delete stored.store[key];
        }
    }
    const worker = writable(stored?.store || {});
    worker.subscribe(data => {
        let parsed = {
            saved: Date.now(),
            requests: {},
            store: {
                ...(data || {})
            }
        };
        for (let key in cached) parsed.store[key] = `${prefix}${cached[key]}`;
        for (let key in requests) if (requests[key].data) parsed.requests[key] = {
            data: requests[key].data,
            fetched: requests[key].fetched
        };
        window.localStorage.setItem(slug, JSON.stringify(parsed));
    });
    return worker;
};

export const request = (path, next, force) => new Promise(async resolve => {
    if (!path) return resolve();
    const route = toKey(path);
    if (!requests[route]) requests[route] = {};
    if (!requests[route].next) requests[route].next = [];
    requests[route].next.push(() => {
        !(!next || typeof next != 'function') && next(requests[route].data);
        resolve(requests[route].data);
        return requests[route].data;
    });
    const done = () => {
        requests[route].next?.length && requests[route].next?.forEach(cb => cb());
        delete requests[route].next;
    }
    const now = Date.now();
    if (!requests[route].init && (!requests[route].data || force || (requests[route]?.fetched + duration) < now)) {
        requests[route].init = 1;
        const req = await fetch(`https://${route}`);
        const res = !req || !req.ok ? null : await req.json();
        if (res) {
            requests[route].fetched = now;
            requests[route].data = res;
        }
        if (requests[route]?.init) delete requests[route].init;
        console.warn(route);
    }
    !requests[route].init && done();
});

export const cache = (target, key, path, next, force) => {
    if (!path || !target || !key) return;
    const route = toKey(path);
    return request(route, data => {
        data && target?.update(res => {
            res[key] = data;
            cached[key] = route;
            return res;
        });
        !(!next || typeof next != 'function') && next(data);
        return data;
    }, force);
};

export let state = writable({});

state.cache = (key, path, next, force) => cache(state, key, path, next, force);

state.put = (key, value) => put(state, key, value);

state.unset = (key) => unset(state, key);

state.clear = () => state.set({});

export let store = init();

store.cache = (key, path, next, force) => cache(store, key, path, next, force);

store.put = (key, value) => put(store, key, value);

store.unset = (key) => unset(store, key);

store.clear = () => {
    requests = {};
    store.set({});
};

export default {
    toKey,
    request,
    cache,
    state,
    store
}