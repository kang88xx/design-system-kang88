import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Accordion,
  Button,
  SegmentedControl,
  Toggle,
  useReducedMotion,
} from "../system/components.jsx";
import {
  addToBag,
  airPodsFeatureDetails,
  calculateBagTotal,
  continuityDetails,
  filterSuggestions,
  menuFamilies,
  products,
  removeFromBag,
  replacementTabs,
  sourceIdsForTab,
  supportTopics,
} from "./data.mjs";
import "./reconstruction.css";

const provenance =
  "로컬 대체 구현입니다. 공개 캡처로 확인되지 않은 Apple 내부 소스, 비공개 컴포넌트, 서버 응답, 인증 상태를 복구했다고 주장하지 않습니다.";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function ProvenanceBar() {
  return (
    <div className="recon-provenance" role="note">
      <span className="status-dot" />
      <span>{provenance}</span>
      <a href="/research/substitutions.json" target="_blank" rel="noreferrer">
        substitution manifest
      </a>
    </div>
  );
}

function SearchPanel({ selectedTab, onSelectTab }) {
  const [query, setQuery] = useState("");
  const suggestions = useMemo(() => filterSuggestions(query), [query]);
  return (
    <section className="recon-panel recon-search" aria-labelledby="recon-search-title">
      <div>
        <span className="eyebrow">Navigation / Search</span>
        <h2 id="recon-search-title">상태 탐색</h2>
      </div>
      <label className="recon-searchbox" htmlFor="recon-search-input">
        <span className="recon-search-label">Search replacement states</span>
        <span aria-hidden="true">⌕</span>
        <input
          id="recon-search-input"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="대체 상태 검색"
        />
      </label>
      <div className="recon-suggestion-list" aria-label="Search suggestions">
        {suggestions.length ? (
          suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => {
                const match = replacementTabs.find((tab) =>
                  suggestion.toLowerCase().includes(tab.label.toLowerCase().split(" ")[0]),
                );
                if (match) onSelectTab(match.id);
                setQuery(suggestion);
              }}
            >
              {suggestion}
            </button>
          ))
        ) : (
          <p className="recon-empty-status" role="status">
            No matching local substitute.
          </p>
        )}
      </div>
      <nav aria-label="Replacement source states" className="recon-source-nav">
        {replacementTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            aria-current={selectedTab === tab.id ? "page" : undefined}
            onClick={() => onSelectTab(tab.id)}
          >
            <span>{tab.label}</span>
            <small>{tab.sourceStateIds.length} blocked states</small>
          </button>
        ))}
      </nav>
    </section>
  );
}

function MenuSubstitute({ selectedTab }) {
  const defaultFamily =
    menuFamilies.find((family) => family.mappedTabs.includes(selectedTab)) || menuFamilies[1];
  const [openMenu, setOpenMenu] = useState(defaultFamily.id);

  useEffect(() => {
    setOpenMenu(defaultFamily.id);
  }, [defaultFamily.id]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpenMenu("");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const activeMenu = menuFamilies.find((family) => family.id === openMenu);

  return (
    <section className="recon-panel recon-menu" aria-labelledby="recon-menu-title">
      <div className="recon-panel-heading">
        <div>
          <span className="eyebrow">Global Nav Menu</span>
          <h2 id="recon-menu-title">Menu button substitute</h2>
        </div>
      </div>
      <div className="recon-menu-buttons" aria-label="Local menu controls">
        {menuFamilies.map((family) => {
          const panelId = `recon-menu-panel-${family.id}`;
          const expanded = openMenu === family.id;
          return (
            <button
              key={family.id}
              type="button"
              aria-expanded={expanded}
              aria-controls={panelId}
              onClick={() => setOpenMenu(expanded ? "" : family.id)}
            >
              {family.label}
            </button>
          );
        })}
      </div>
      {activeMenu ? (
        <div
          className="recon-menu-panel"
          id={`recon-menu-panel-${activeMenu.id}`}
          aria-label={`${activeMenu.label} menu links`}
        >
          {activeMenu.groups.map(([heading, links]) => (
            <div key={heading}>
              <strong>{heading}</strong>
              {links.map((link) => (
                <a key={link} href={`https://www.apple.com${{ store: "/us/shop/goto/store", mac: "/mac/", ipad: "/ipad/", iphone: "/iphone/", home: "/tv-home/", support: "/support/" }[activeMenu.id] || "/"}`} target="_blank" rel="noreferrer">
                  {link}
                </a>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <p className="recon-empty-status" role="status">
          Menu closed.
        </p>
      )}
    </section>
  );
}

function BagPanel({ bagItems, onAdd, onRemove }) {
  const total = calculateBagTotal(bagItems);
  return (
    <section className="recon-panel recon-bag" aria-labelledby="recon-bag-title">
      <div className="recon-panel-heading">
        <div>
          <span className="eyebrow">Bag / Local Data</span>
          <h2 id="recon-bag-title">Bag state</h2>
        </div>
        <strong>{formatCurrency(total)}</strong>
      </div>
      <div className="recon-bag-list" aria-live="polite">
        {bagItems.length === 0 ? (
          <p>Your bag is empty.</p>
        ) : (
          bagItems.map((item) => (
            <div className="recon-bag-row" key={item.id}>
              <span>
                <strong>{item.title}</strong>
                <small>
                  {formatCurrency(item.price)} × {item.quantity}
                </small>
              </span>
              <button type="button" onClick={() => onRemove(item.id)} aria-label={`Remove ${item.title}`}>
                −
              </button>
            </div>
          ))
        )}
      </div>
      <div className="recon-add-grid">
        {products.slice(0, 3).map((product) => (
          <button key={product.id} type="button" onClick={() => onAdd(product.id)}>
            Add {product.title}
          </button>
        ))}
      </div>
    </section>
  );
}

function ProductGallery({ selectedTab, onOpenDetails }) {
  const reducedMotion = useReducedMotion();
  const [selectedProductId, setSelectedProductId] = useState("iphone-pro");
  const [selectedColor, setSelectedColor] = useState("silver");
  const product = products.find((item) => item.id === selectedProductId) || products[0];
  const activeColor = product.colors.find((color) => color.id === selectedColor) || product.colors[0];

  useEffect(() => {
    if (selectedTab === "mac" || selectedTab === "macbook") {
      setSelectedProductId("macbook-air");
      setSelectedColor(selectedTab === "macbook" ? "midnight" : "silver");
    }
    if (selectedTab === "iphone") {
      setSelectedProductId("iphone-pro");
      setSelectedColor("silver");
    }
    if (selectedTab === "airpods") {
      setSelectedProductId("airpods-pro");
      setSelectedColor("white");
    }
    if (selectedTab === "home") {
      setSelectedProductId("homepod-mini");
      setSelectedColor("white");
    }
  }, [selectedTab]);

  useEffect(() => {
    const nextProduct = products.find((item) => item.id === selectedProductId);
    if (nextProduct && !nextProduct.colors.some((color) => color.id === selectedColor)) {
      setSelectedColor(nextProduct.colors[0]?.id || "");
    }
  }, [selectedColor, selectedProductId]);

  return (
    <section className="recon-gallery" aria-labelledby="recon-gallery-title">
      <div className="recon-gallery-copy">
        <span className="eyebrow">Product Gallery</span>
        <h2 id="recon-gallery-title">{product.title}</h2>
        <p>{product.subtitle}</p>
        <SegmentedControl
          label="Product family"
          options={products.map((item) => ({ value: item.id, label: item.family }))}
          value={product.id}
          onChange={setSelectedProductId}
        />
        <div className="recon-color-nav" aria-label="Product color">
          {product.colors.map((color) => (
            <button
              key={color.id}
              type="button"
              aria-label={color.label}
              aria-pressed={color.id === activeColor.id}
              onClick={() => setSelectedColor(color.id)}
            >
              <span style={{ background: color.hex }} />
            </button>
          ))}
        </div>
        <Button size="small" onClick={() => onOpenDetails(product)}>
          Details
        </Button>
      </div>
      <div
        className="recon-product-stage"
        data-reduced-motion={reducedMotion ? "true" : undefined}
        style={{ "--recon-product-color": activeColor.hex }}
      >
        <div className="recon-device">
          <span>{product.family}</span>
          <strong>{activeColor.label}</strong>
        </div>
      </div>
    </section>
  );
}

function DetailsDialog({ product, onClose }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !product) return undefined;
    if (!dialog.open) dialog.showModal();
    const close = () => onClose();
    dialog.addEventListener("close", close);
    return () => dialog.removeEventListener("close", close);
  }, [product, onClose]);

  return (
    <dialog
      className="recon-dialog"
      ref={dialogRef}
      aria-labelledby="recon-dialog-title"
      onClick={(event) => {
        if (event.target === dialogRef.current) dialogRef.current.close();
      }}
    >
      {product && (
        <>
          <form method="dialog" className="recon-dialog-close">
            <button aria-label="Close details">×</button>
          </form>
          <span className="eyebrow">Feature Details</span>
          <h2 id="recon-dialog-title">{product.title}</h2>
          <p>{product.subtitle}</p>
          <ul>
            {product.features.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
        </>
      )}
    </dialog>
  );
}

function AccountDemo() {
  const [signedIn, setSignedIn] = useState(false);
  return (
    <section className="recon-panel recon-account" aria-labelledby="recon-account-title">
      <div className="recon-panel-heading">
        <div>
          <span className="eyebrow">Account / Demo</span>
          <h2 id="recon-account-title">Account states</h2>
        </div>
        <Toggle label="Demo signed in" checked={signedIn} onChange={setSignedIn} />
      </div>
      <div className="recon-account-state">
        <strong>{signedIn ? "Saved devices visible" : "Signed out"}</strong>
          <p>
            {signedIn
            ? "Local device cards and service status are shown without personal data."
            : "No login form, password field, token field, or remote authentication is present."}
        </p>
      </div>
    </section>
  );
}

export function Reconstruction() {
  const [selectedTab, setSelectedTab] = useState("iphone");
  const [bagItems, setBagItems] = useState([]);
  const [dialogProduct, setDialogProduct] = useState(null);
  const sourceIds = sourceIdsForTab(selectedTab);
  const tab = replacementTabs.find((item) => item.id === selectedTab);

  return (
    <div className="recon-surface">
      <ProvenanceBar />
      <header className="recon-hero">
        <div>
          <span className="eyebrow">Reconstruction Source</span>
          <h1>Blocked states, usable substitutes.</h1>
          <p>
            공개 수집에서 막힌 14개 UI 상태를 관찰된 패턴에 맞춘 로컬 근사 구현으로 보강했습니다.
          </p>
        </div>
        <SegmentedControl
          label="Replacement area"
          options={replacementTabs.map((item) => ({ value: item.id, label: item.label }))}
          value={selectedTab}
          onChange={setSelectedTab}
        />
      </header>

      <div className="recon-layout">
        <SearchPanel selectedTab={selectedTab} onSelectTab={setSelectedTab} />
        <div className="recon-main" aria-labelledby="recon-current-title">
          <section className="recon-panel recon-current">
            <span className="eyebrow">Current Substitute</span>
            <h2 id="recon-current-title">{tab?.title}</h2>
            <p>{tab?.summary}</p>
            <div className="recon-state-chips" aria-label="Mapped source state IDs">
              {sourceIds.map((id) => (
                <code key={id}>{id}</code>
              ))}
            </div>
          </section>
          <MenuSubstitute selectedTab={selectedTab} />
          <ProductGallery selectedTab={selectedTab} onOpenDetails={setDialogProduct} />
          <section className="recon-panel">
            <div className="recon-panel-heading">
              <div>
                <span className="eyebrow">Expandable Details</span>
                <h2>Feature and support disclosures</h2>
              </div>
            </div>
            <Accordion
              items={[
                {
                  title: "Private authoring tokens",
                  content: "Internal token names and component source are unavailable, so this app uses observed colors, spacing, radius, and motion only.",
                },
                {
                  title: "Server and auth states",
                  content: "Bag, account, and support states are local samples. No Apple server, payment, identity, or credential workflow is invoked.",
                },
                ...airPodsFeatureDetails,
                ...continuityDetails,
                ...supportTopics,
              ]}
            />
          </section>
        </div>
        <aside className="recon-side">
          <BagPanel
            bagItems={bagItems}
            onAdd={(id) => setBagItems((items) => addToBag(items, id))}
            onRemove={(id) => setBagItems((items) => removeFromBag(items, id))}
          />
          <AccountDemo />
        </aside>
      </div>
      {dialogProduct && <DetailsDialog product={dialogProduct} onClose={() => setDialogProduct(null)} />}
    </div>
  );
}

export default Reconstruction;
