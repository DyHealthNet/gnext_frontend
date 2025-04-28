<template>
  <nav class="navbar">
    <router-link to="/" class="nav-link">PheWeb Extended</router-link>
    <v-spacer></v-spacer>
    <router-link to="/phenotypes" class="nav-link">Phenotypes</router-link>
    <router-link to="/tophits" class="nav-link">Top Hits</router-link>
    <router-link to="/about" class="nav-link">About</router-link>

  </nav>
</template>

<script>
export default {
  name: 'NavBar',
}
</script>

<style scoped>

.navbar {
  background-color: #333;
  padding: 1rem;
  display: flex;
  gap: 1.5rem;
}

.nav-link {
  color: white;
  text-decoration: none;
}

.router-link-exact-active {
  font-weight: bold;
}

</style>