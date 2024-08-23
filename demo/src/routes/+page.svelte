<script lang="ts">
import { CachedResolver } from "@digitalbazaar/did-io";
import didDsnp from "@dsnp/did-resolver";
import { FrequencyResolver } from "../../../dist/index.js";

let inputDid: string = 'did:dsnp:';
let inputProviderUri: string = 'wss://0.rpc.testnet.amplica.io';
let error: string = '';
let result: string = '';

async function doResolve() {
  try {
    const frequencyResolver = new FrequencyResolver({
      providerUri: inputProviderUri,
    });

    const resolver = new CachedResolver();
    resolver.use(didDsnp.driver([frequencyResolver]));
    try {
      result = await resolver.get({did: inputDid});
      error = null;
    } catch (e) {
      result = null;
      error = "Could not resolve DID: " + e;
    }

    await frequencyResolver.disconnect();
  } catch (e) {
    result = null;
    error = e;
  }
}
</script>
  <main>
<h1>DSNP over Frequency DID Resolver</h1>

<form>
<p>
  <label for="providerUri">Network:</label>
  <select id="providerUri" bind:value={inputProviderUri} on:change={() => (inputDid = 'did:dsnp:')}>
    <option value="wss://0.rpc.testnet.amplica.io">Frequency Testnet (0.rpc.testnet.amplica.io)</option>
    <option value="wss://1.rpc.frequency.xyz">Frequency Mainnet (1.rpc.frequency.xyz)</option>
    <option value="ws://localhost:9944">Local Frequency Node (localhost:9944)</option>
  </select>
</p>

  <p>
  <label for="did">DID to resolve:</label>
  <input type=text id="did" bind:value={inputDid} />
</p>
<p>
  <button on:click={doResolve}>Resolve</button>
  </p>
</form>

{#if result}
  <p>
  <label for="resultArea">Result:</label>
  <textarea id="resultArea" rows=40>{JSON.stringify(result,null,2)}</textarea>
  {/if}
{#if error}
<p>{error}</p>
   {/if}


</main>
   <style>
	main {
		max-width: 1000px;
		margin: 0 auto;
		padding: 3rem;
	}

	label {
		display: block;
		margin-bottom: 0.5rem;
	}

    input, textarea {
		width: 100%;
	}

	input,
	button {
		font-size: 1rem;
		padding: 0.5rem 1rem;
		margin-bottom: 1rem;
		box-sizing: border-box;
	}
</style>
