#!/usr/bin/env node

const newman = require('newman');
const path = require('path');
const fs = require('fs');

// Cargar colección
const collectionPath = path.join(__dirname, 'YA_postman_collection_runner.json');
if (!fs.existsSync(collectionPath)) {
  console.error('No se encontró YA_postman_collection_runner.json en la carpeta postman/');
  process.exit(1);
}
const collection = require(collectionPath);

// Orden exacto de los requests en la colección
const itemOrder = [
  '1 - Verificar restaurante',
  '2 - Login mesero2',
  '3 - Ocupar mesa',
  '4 - Obtener menú móvil',
  '5 - Crear pedido móvil',
  '6 - Marcar pedido en proceso',
  '7 - Marcar pedido completado',
  '8 - Pedir cuenta desde móvil',
  '9 - Registrar pago final',
  '10 - Liberar mesa',
  '10.1 - Login dueño',
  '11 - Ver dashboard financiero'
];

// Variables por defecto
let baseUrl = 'http://localhost:10000';
let mesaId = '7';
let delayRequest = 60000; // 1 minuto por request por defecto
let waitAfterCreate = 0;

// Parsear argumentos CLI
process.argv.slice(2).forEach(arg => {
  if (arg.startsWith('--baseUrl=')) baseUrl = arg.split('=')[1];
  if (arg.startsWith('--mesaId=')) mesaId = arg.split('=')[1];
  if (arg.startsWith('--delayRequest=')) delayRequest = parseInt(arg.split('=')[1], 10) || 60000;
  if (arg.startsWith('--waitAfterCreate=')) waitAfterCreate = parseInt(arg.split('=')[1], 10) || 0;
});

// Environment object que se pasa a Newman
const environment = {
  id: 'local-env',
  name: 'local',
  values: [
    { key: 'base_url', value: baseUrl },
    { key: 'mesa_id', value: mesaId },
    { key: 'pin', value: '' },
    { key: 'order_id', value: '' }
  ]
};

// Funciones helper
function getEnvValue(key) {
  const v = environment.values.find(x => x.key === key);
  return v ? v.value : undefined;
}

function setEnvValue(key, value) {
  const idx = environment.values.findIndex(x => x.key === key);
  if (idx >= 0) {
    environment.values[idx].value = value;
  } else {
    environment.values.push({ key, value });
  }
}

// Ejecutar un request de la colección
function runItem(itemName) {
  return new Promise((resolve, reject) => {
    console.log(`\n>> Ejecutando: ${itemName}`);
    
    newman.run({
      collection: collection,
      environment: environment,
      reporters: ['cli'],
      insecure: true,
      timeoutRequest: 60000,
      item: itemName
    }, function (err, summary) {
      if (err) {
        return reject(err);
      }

      // Intentar extraer PIN y order_id de la respuesta
      try {
        const executions = summary.run && summary.run.executions;
        if (executions && executions.length > 0) {
          const exec = executions[0];
          if (exec.response && exec.response.stream) {
            let body = '';
            if (Buffer.isBuffer(exec.response.stream)) {
              body = exec.response.stream.toString();
            } else {
              body = exec.response.stream;
            }
            
            try {
              const json = JSON.parse(body);
              if (json.codigo) {
                setEnvValue('pin', String(json.codigo));
                console.log(`   ✓ PIN guardado: ${json.codigo}`);
              }
              if (json.id_pedido) {
                setEnvValue('order_id', String(json.id_pedido));
                console.log(`   ✓ Order ID guardado: ${json.id_pedido}`);
              }
            } catch (e) {
              // No es JSON, ignorar
            }
          }
        }
      } catch (e) {
        // Ignorar errores de extracción
      }

      resolve(summary);
    });
  });
}

// Función principal async
async function main() {
  console.log('=====================================');
  console.log('Newman Runner - YA! Restaurant');
  console.log('=====================================');
  console.log('Parámetros:');
  console.log(`  baseUrl: ${baseUrl}`);
  console.log(`  mesaId: ${mesaId}`);
  console.log(`  delayRequest: ${delayRequest}ms`);
  console.log(`  waitAfterCreate: ${waitAfterCreate}ms`);
  console.log('=====================================\n');

  try {
    for (let i = 0; i < itemOrder.length; i++) {
      const itemName = itemOrder[i];
      
      await runItem(itemName);
      
      // Si es el request "5 - Crear pedido móvil", esperar waitAfterCreate ms
      if (itemName === '5 - Crear pedido móvil' && waitAfterCreate > 0) {
        console.log(`\n⏳ Esperando ${waitAfterCreate}ms después de crear pedido...\n`);
        await new Promise(r => setTimeout(r, waitAfterCreate));
      }
      
      // Esperar delayRequest ms antes del siguiente request (excepto el último)
      if (i < itemOrder.length - 1) {
        console.log(`⏳ Esperando ${delayRequest}ms antes del siguiente request...\n`);
        await new Promise(r => setTimeout(r, delayRequest));
      }
    }

    console.log('\n=====================================');
    console.log('✅ Runner completado exitosamente');
    console.log('=====================================');
    console.log('Variables finales:');
    console.log(`  pin: ${getEnvValue('pin')}`);
    console.log(`  order_id: ${getEnvValue('order_id')}`);
    console.log('=====================================\n');
    
  } catch (err) {
    console.error('\n❌ Error durante la ejecución:', err.message || err);
    process.exit(1);
  }
}

// Exports para uso externo
module.exports = {
  environment,
  getEnvValue,
  setEnvValue,
  runItem,
  itemOrder
};

// Si se ejecuta directamente como script
if (require.main === module) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
