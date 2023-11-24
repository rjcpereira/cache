<script>
    import { store, state, cache } from "./cache";
    $: items = { store: $store, state: $state };
    cache(store, "tempoLocais", "");
    $: !$state.local && ($state.local = 1110600);
    $: $state.local && cache(store, "tempoActual", "" + $state.local);
    window.state = state;
    window.store = store;
</script>

<button on:click={store.clear}>clear</button>
<button on:click={() => ($state.local = 1010400)}>1010400</button>
<button on:click={() => ($state.local = 1101000)}>1101000</button>
<button on:click={() => ($state.local = 1100900)}>1100900</button>
<button on:click={() => ($store.dark = !$store.dark)}
    >toggle dark ({$store.dark})</button
>

{#if items}
    {#each Object.entries(items) as [title, item]}
        {#each Object.entries(item) as [key, val]}
            <h4>{title}.{key}</h4>
            <pre>{JSON.stringify(val)}</pre>
        {/each}
    {/each}
{/if}
