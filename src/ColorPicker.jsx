import React, { useState } from 'react';

const ColorPicker = ({ colorActual, onColorChange, titulo = "Color Principal" }) => {
  const [showPicker, setShowPicker] = useState(false);
  
  // Paleta de colores predefinidos (verdes y azules agradables)
  const paletaPredefinida = [
    '#10b981', // Verde esmeralda (default HGW)
    '#059669', // Verde oscuro
    '#047857', // Verde muy oscuro
    '#34d399', // Verde claro
    '#6ee7b7', // Verde menta
    '#3b82f6', // Azul
    '#2563eb', // Azul oscuro
    '#1d4ed8', // Azul muy oscuro
    '#60a5fa', // Azul claro
    '#93c5fd', // Azul cielo
    '#8b5cf6', // Morado
    '#ec4899', // Rosa
    '#f59e0b', // Naranja
    '#ef4444', // Rojo
  ];

  const handleColorSelect = (color) => {
    onColorChange(color);
    setShowPicker(false);
  };

  return (
    <div className="color-picker-container" style={{ marginBottom: '20px' }}>
      <label style={{ 
        display: 'block', 
        marginBottom: '8px', 
        fontWeight: '500',
        color: '#374151'
      }}>
        {titulo}
      </label>
      
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        {/* Color actual */}
        <div
          onClick={() => setShowPicker(!showPicker)}
          style={{
            width: '50px',
            height: '50px',
            backgroundColor: colorActual,
            border: '2px solid #d1d5db',
            borderRadius: '8px',
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        />
        
        {/* Input manual hex */}
        <input
          type="text"
          value={colorActual}
          onChange={(e) => {
            const val = e.target.value;
            // Solo actualizar si es un hex válido o está siendo editado
            if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) onColorChange(val);
          }}
          placeholder="#10b981"
          maxLength={7}
          style={{
            padding: '10px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
            fontFamily: 'monospace',
            width: '110px',
          }}
        />

        {/* Input nativo tipo color — abre el selector del sistema */}
        <input
          type="color"
          value={/^#[0-9A-Fa-f]{6}$/.test(colorActual) ? colorActual : '#10b981'}
          onChange={(e) => onColorChange(e.target.value)}
          style={{
            width: '40px',
            height: '40px',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            padding: '2px',
            background: 'transparent',
          }}
          title="Selector avanzado"
        />

        {/* Botón paleta */}
        <button
          onClick={() => setShowPicker(!showPicker)}
          style={{
            padding: '10px 16px',
            backgroundColor: '#f3f4f6',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          {showPicker ? 'Cerrar' : 'Paleta'}
        </button>
      </div>

      {/* Paleta de colores */}
      {showPicker && (
        <div style={{
          marginTop: '12px',
          padding: '16px',
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        }}>
          <p style={{ 
            fontSize: '12px', 
            color: '#6b7280', 
            marginBottom: '12px',
            fontWeight: '500'
          }}>
            Selecciona un color:
          </p>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '8px',
          }}>
            {paletaPredefinida.map((color) => (
              <div
                key={color}
                onClick={() => handleColorSelect(color)}
                style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: color,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  border: colorActual === color ? '3px solid #1f2937' : '1px solid #e5e7eb',
                  transition: 'all 0.2s',
                  boxShadow: colorActual === color ? '0 0 0 3px rgba(16, 185, 129, 0.2)' : 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.15)';
                  e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = colorActual === color ? '0 0 0 3px rgba(16, 185, 129, 0.2)' : 'none';
                }}
                title={color}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorPicker;
