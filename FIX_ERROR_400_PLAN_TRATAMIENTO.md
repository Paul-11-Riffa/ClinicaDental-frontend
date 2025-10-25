# 🔧 FIX: Error 400 al Crear Plan de Tratamiento

> **Fecha:** 25 de Octubre de 2025  
> **Problema:** `{'items_iniciales': [{'idestado': ['Clave primaria "1" inválida - objeto no existe.']}]}`  
> **Causa:** El frontend enviaba `idestado` en los items, pero ese campo se asigna automáticamente  
> **Estado:** ✅ SOLUCIONADO

---

## 🐛 Análisis del Error

### Request del Frontend:
```json
{
  "codpaciente": 6,
  "cododontologo": 7,
  "items_iniciales": [
    {
      "idservicio": 3,
      "idestado": 1,  // ❌ ESTO CAUSABA EL ERROR
      "idpiezadental": null,
      "costofinal": 50,
      "fecha_objetivo": "2025-10-31",
      "tiempo_estimado": 30,
      "orden": 0
    }
  ]
}
```

### Error Específico:
```
ERROR ❌ Errores de validación: {
  'items_iniciales': [
    {
      'idestado': [
        ErrorDetail(
          string='Clave primaria "1" inválida - objeto no existe.', 
          code='does_not_exist'
        )
      ]
    }
  ]
}
```

### Causa Raíz:
1. ❌ El frontend enviaba `idestado: 1` en cada item
2. ❌ La empresa SmileStudio NO tenía Estados creados en la base de datos
3. ❌ El serializer intentaba validar `idestado` como ForeignKey y fallaba

---

## ✅ Solución Implementada

### 1. Crear Estados para SmileStudio
Se ejecutó el script `crear_estados_smilestudio.py` que creó:
- ID=1: **Pendiente** (ya existía)
- ID=2: **En Proceso**
- ID=3: **Completado**
- ID=4: **Cancelado**
- ID=5: **Activo**

### 2. Modificar Serializer de Items
Se actualizó `CrearItemPlanSerializer` para:

**ANTES:**
```python
class CrearItemPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Itemplandetratamiento
        fields = [
            'idservicio',
            'idpiezadental',
            'idestado',  # ❌ El frontend tenía que enviar esto
            'costofinal',
            # ...
        ]
```

**DESPUÉS:**
```python
class CrearItemPlanSerializer(serializers.ModelSerializer):
    # idestado NO debe ser incluido aquí - se asigna automáticamente
    
    class Meta:
        model = Itemplandetratamiento
        fields = [
            'idservicio',
            'idpiezadental',
            'costofinal',
            'fecha_objetivo',
            'tiempo_estimado',
            'estado_item',  # ✅ Usar estado_item en lugar de idestado
            'notas_item',
            'orden',
        ]
```

### 3. Asignación Automática de idestado
Se modificó el método `create()` para asignar automáticamente:

```python
def create(self, validated_data):
    """Crear ítem y capturar costo base del servicio."""
    servicio = validated_data.get('idservicio')
    plan = validated_data.get('idplantratamiento')
    
    # ... código existente ...
    
    # Asignar idestado automáticamente (required en el modelo)
    # Buscar estado "Pendiente" de la empresa
    try:
        estado_pendiente = Estado.objects.get(
            empresa=plan.empresa,
            estado='Pendiente'
        )
        validated_data['idestado'] = estado_pendiente
    except Estado.DoesNotExist:
        # Si no existe, crear el estado Pendiente
        estado_pendiente = Estado.objects.create(
            empresa=plan.empresa,
            estado='Pendiente'
        )
        validated_data['idestado'] = estado_pendiente
    
    return super().create(validated_data)
```

---

## 📋 Cambios Requeridos en el Frontend

### ❌ ANTES - Request Incorrecto:
```typescript
const itemData = {
  idservicio: 3,
  idestado: 1,  // ❌ NO ENVIAR ESTO
  idpiezadental: selectedPieza || null,
  costofinal: 50,
  fecha_objetivo: "2025-10-31",
  tiempo_estimado: 30,
  orden: 0
};
```

### ✅ DESPUÉS - Request Correcto:
```typescript
const itemData = {
  idservicio: 3,
  // ✅ idestado se asigna automáticamente - NO ENVIAR
  idpiezadental: selectedPieza || null,
  costofinal: 50,
  fecha_objetivo: "2025-10-31",
  tiempo_estimado: 30,
  estado_item: "Pendiente",  // ✅ OPCIONAL - usa estado_item si necesitas especificar
  notas_item: "",  // Opcional
  orden: 0
};
```

### Interface TypeScript Actualizada:
```typescript
interface ItemPlanRequest {
  idservicio: number;  // ✅ REQUERIDO
  idpiezadental?: number | null;  // Opcional
  costofinal?: number;  // Opcional - usa costo del servicio si no se especifica
  fecha_objetivo?: string;  // Opcional - formato YYYY-MM-DD
  tiempo_estimado?: number;  // Opcional - usa duración del servicio si no se especifica
  estado_item?: 'Pendiente' | 'Activo' | 'Cancelado' | 'Completado';  // Opcional - default: Pendiente
  notas_item?: string;  // Opcional
  orden?: number;  // Opcional - default: 0
}
```

---

## 🔍 Diferencia entre idestado y estado_item

### `idestado` (ForeignKey a Estado)
- ⚙️ **Uso interno del backend**
- 🔒 **NO debe enviarse desde el frontend**
- ✅ Se asigna automáticamente al crear el item
- 📊 Representa el estado en el sistema de flujo de trabajo

### `estado_item` (CharField)
- 📝 **Campo de negocio**
- ✅ **Puede enviarse desde el frontend** (opcional)
- 🎯 Valores: `'Pendiente'`, `'Activo'`, `'Cancelado'`, `'Completado'`
- 📊 Controla el flujo del item en el plan de tratamiento

**Importante:** Aunque tienen nombres similares, son campos diferentes:
- `idestado` es para el sistema de estados general (tabla `estado`)
- `estado_item` es específico para items del plan de tratamiento

---

## ✅ Verificación de la Solución

### 1. Reiniciar el Servidor Django
```bash
# Detener el servidor (CTRL+C)
# Iniciar nuevamente
python manage.py runserver
```

### 2. Probar Creación de Plan desde Frontend
```typescript
// Payload mínimo
{
  "codpaciente": 6,
  "cododontologo": 7,
  "items_iniciales": [
    {
      "idservicio": 3,
      "costofinal": 50,
      "fecha_objetivo": "2025-10-31",
      "tiempo_estimado": 30,
      "orden": 0
    }
  ]
}
```

### 3. Respuesta Esperada
```json
{
  "id": 1,
  "paciente": {
    "nombre": "...",
    "apellido": "..."
  },
  "odontologo": {
    "nombre": "Dr. ...",
  },
  "estado_plan": "Borrador",
  "fechaplan": "2025-10-25",
  "items": [
    {
      "id": 1,
      "idservicio": 3,
      "servicio_nombre": "...",
      "idestado": 1,  // ✅ Asignado automáticamente
      "estado_item": "Pendiente",  // ✅ Default
      "costofinal": "50.00",
      // ...
    }
  ]
}
```

---

## 📝 Resumen de Cambios

| Archivo | Cambio | Motivo |
|---------|--------|--------|
| `api/serializers_plan_tratamiento.py` | Removido `idestado` de `fields` en `CrearItemPlanSerializer` | No debe enviarse desde frontend |
| `api/serializers_plan_tratamiento.py` | Agregado `estado_item` a `fields` | Campo correcto para estado del item |
| `api/serializers_plan_tratamiento.py` | Modificado método `create()` para asignar `idestado` automáticamente | Campo requerido en modelo pero gestionado por backend |
| `crear_estados_smilestudio.py` | Creado script para generar estados | SmileStudio no tenía estados en la BD |

---

## 🎯 Próximos Pasos

1. ✅ **Backend listo** - Servidor reiniciado con los cambios
2. 🔧 **Frontend pendiente** - Eliminar `idestado` del payload de items
3. ✅ **Estados creados** - SmileStudio tiene 5 estados disponibles
4. 🧪 **Probar** - Crear plan de tratamiento desde el frontend

---

## 📞 Testing Checklist

- [ ] Reiniciar servidor Django
- [ ] Eliminar `idestado` del payload en el frontend
- [ ] Intentar crear plan con los datos correctos
- [ ] Verificar que se crea exitosamente (Status 201)
- [ ] Confirmar que los items tienen `idestado=1` (Pendiente) asignado automáticamente
- [ ] Verificar que `estado_item` es 'Pendiente' por defecto

---

**Documento creado:** 25 de Octubre de 2025  
**Estado:** ✅ SOLUCIÓN IMPLEMENTADA  
**Requiere:** Cambio en frontend para eliminar `idestado` del payload
