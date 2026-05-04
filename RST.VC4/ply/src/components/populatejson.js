import React, { useState } from "react";

function isImageField(fieldName) {
  return /photo|image/i.test(fieldName);
}

function renderInput(field, value, onChange) {
  if (isImageField(field)) {
    return (
      <input
      className="form-control"
        type="file"
        accept="image/*"
        onChange={async (e) => {
          const file = e.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
              onChange(ev.target.result);
            };
            reader.readAsDataURL(file);
          }
        }}
      />
    );
  }
  if (typeof value === "boolean") {
    return (
      <input className="form-check-input"
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
      />
    );
  }
  if (typeof value === "number") {
    return (
      <input className="form-control"
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    );
  }
  return (
    <input className="form-control"
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function renderObject(obj, onChange) {
  return Object.entries(obj).map(([key, value]) => (
    <div key={key} className="mb-3">
      <label className="form-label">{key}</label>
      {Array.isArray(value) ? (
        <ArrayEditor
          field={key}
          value={value}
          onChange={(newArr) => onChange({ ...obj, [key]: newArr })}
        />
      ) : typeof value === "object" && value !== null ? (
        <div className="ms-3 border-start ps-2">
          {renderObject(value, (newVal) => onChange({ ...obj, [key]: newVal }))}
        </div>
      ) : (
        renderInput(key, value, (newVal) => onChange({ ...obj, [key]: newVal }))
      )}
    </div>
  ));
}

function ArrayEditor({ field, value, onChange }) {
  const handleItemChange = (idx, newItem) => {
    const newArr = value.slice();
    newArr[idx] = newItem;
    onChange(newArr);
  };
  const handleAdd = () => {
    let newItem = {};
    if (value.length > 0 && typeof value[0] === "object") {
      newItem = Object.fromEntries(Object.keys(value[0]).map((k) => [k, ""]));
    }
    onChange([...value, newItem]);
  };
  const handleRemove = (idx) => {
    const newArr = value.slice();
    newArr.splice(idx, 1);
    onChange(newArr);
  };
  return (
    <div className="ms-3 border-start ps-2">
      {value.map((item, idx) => (
        <div key={idx} className="mb-2 border p-2 rounded">
          {typeof item === "object" && item !== null ? (
            renderObject(item, (newObj) => handleItemChange(idx, newObj))
          ) : (
            renderInput(field, item, (newVal) => handleItemChange(idx, newVal))
          )}
          <button type="button" className="btn btn-danger btn-sm ms-2" onClick={() => handleRemove(idx)}>
            Remove
          </button>
        </div>
      ))}
      <button type="button" className="btn btn-primary btn-sm mt-2" onClick={handleAdd}>Add {field}</button>
    </div>
  );
}

export default function PopulateJson({ data, onChange }) {
  const [json, setJson] = useState(data);

  const handleChange = (newJson) => {
    setJson(newJson);
    if (onChange) onChange(newJson);
  };

  return (
    <form className="container" style={{ maxWidth: 700 }}>
      {renderObject(json, handleChange)}
    </form>
  );
}
