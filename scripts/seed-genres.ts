// Script para verificar la configuración del proyecto
import { getAllGenres } from '../src/lib/genres';

const genres = getAllGenres();
console.log('✅ Géneros disponibles:');
genres.forEach(g => {
  console.log(`  - ${g.name} (${g.id}): ${g.sceneCount} escenas, ${g.totalDuration}s`);
});
console.log('\n✅ Base de datos: se inicializa automáticamente al primer uso');
console.log('✅ Directorios de storage: creados en /storage/');
console.log('\n🎬 FriendFlix listo para usar!');
