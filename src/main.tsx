import { tsx, renderer, create } from "@dojo/framework/core/vdom";
import icache from "@dojo/framework/core/middleware/icache";
import cache from "@dojo/framework/core/middleware/cache";
import "@material/card/dist/mdc.card.css";
import "@material/button/dist/mdc.button.css";
import "@material/typography/dist/mdc.typography.css";

const factory = create({ icache, cache });

function getUrl(offset: number, size: number = 20) {
  return `https://pokeapi.co/api/v2/pokemon?limit=${size}&offset=${offset}`;
}

const App = factory(function App({ middleware: { icache, cache } }) {
  const listResults = icache.getOrSet("results", async () => {
    const response = await fetch(getUrl(0));
    const json = await response.json();
    return json;
  });

  if (!listResults) {
    return (
      <div classes={["centered"]}>
        <div classes={["loader"]}>Loading...</div>
      </div>
    );
  }

  const openList = cache.get<Set<string>>("open-list");

  return (
    <div classes={["mdc-typography"]}>
      <header classes={["header"]}>
        <button
          classes={["mdc-button"]}
          disabled={!listResults.previous}
          onclick={() => {
            icache.set("results", async () => {
              const offset = (cache.get<number>("offset") || 0) - 20;
              cache.set("offset", offset);
              const response = await fetch(getUrl(offset));
              const json = await response.json();
              return json;
            });
          }}
        >
          prev
        </button>
        <button
          classes={["mdc-button"]}
          disabled={!listResults.next}
          onclick={() => {
            icache.set("results", async () => {
              const offset = (cache.get<number>("offset") || 0) + 20;
              cache.set("offset", offset);
              const response = await fetch(getUrl(offset));
              const json = await response.json();
              return json;
            });
          }}
        >
          next
        </button>
        <button
          classes={["mdc-button"]}
          disabled={!openList || openList.size === 0}
          onclick={() => {
            const openList = cache.get<Set<string>>("open-list");
            openList.forEach(key => {
              icache.set(key, null);
            });
            cache.set("open-list", null);
          }}
        >
          close all
        </button>
      </header>

      <div classes={["all"]}>
        <div classes={["cards"]}>
          {listResults.results.map(result => {
            const details = icache.get(result.name);
            return (
              <div
                key={result.name}
                classes={["card", "mdc-card", details && "open"]}
                onclick={() => {
                  if (details) {
                    icache.set(result.name, null);
                    const openList =
                      cache.get<Set<string>>("open-list") || new Set();
                    openList.delete(result.name);
                  } else {
                    icache.set(result.name, async () => {
                      const response = await fetch(result.url);
                      const json = await response.json();
                      const openList =
                        cache.get<Set<string>>("open-list") || new Set();
                      openList.add(result.name);
                      cache.set("open-list", openList);
                      return json;
                    });
                  }
                }}
              >
                <div classes={["mdc-typography--headline6", "name"]}>
                  {result.name}
                </div>
                {details && (
                  <div classes="details">
                    <div classes={["stats", "mdc-typography--body2"]}>
                      <div classes={["stat"]}>
                        <span classes={["mdc-typography--subtitle2"]}>
                          Height:
                        </span>
                        <span>{` ${details.height}`}</span>
                      </div>
                      <div classes={["stat"]}>
                        <span classes={["mdc-typography--subtitle2"]}>
                          Weight:
                        </span>
                        <span>{` ${details.weight}`}</span>
                      </div>
                      <div>
                        {details.stats.map(stat => (
                          <div classes={["stat"]}>
                            <span classes={["mdc-typography--subtitle2"]}>{`${
                              stat.stat.name
                            }: `}</span>
                            <span>{`${stat.base_stat}`}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div
                      classes={["image"]}
                      styles={{
                        backgroundImage: `url("${
                          details.sprites.front_default
                        }")`
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

const r = renderer(() => <App />);
r.mount();
