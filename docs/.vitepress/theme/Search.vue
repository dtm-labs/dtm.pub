<script setup>
import { ref } from 'vue'
const inputVal = ref('')
const search = () => {
  console.log(inputVal.value)
  window.open(`https://www.google.com/search?q=site:dtm.pub/t%${inputVal.value}`)
}
</script>

<template>
	<div class="search-container">
    <button class="search-icon" @click="search">
      <svg width="20" height="20" viewBox="0 0 20 20">
        <path
          d="M14.386 14.386l4.0877 4.0877-4.0877-4.0877c-2.9418 2.9419-7.7115 2.9419-10.6533 0-2.9419-2.9418-2.9419-7.7115 0-10.6533 2.9418-2.9419 7.7115-2.9419 10.6533 0 2.9419 2.9418 2.9419 7.7115 0 10.6533z"
          stroke="currentColor"
          fill="none"
          fill-rule="evenodd"
          stroke-linecap="round"
          stroke-linejoin="round"
        ></path>
      </svg>
    </button>
		<input
      class="search-input"
      type="text"
      maxlength="128"
      autocomplete="off"
      tabindex="1"
      v-model="inputVal"
      @keydown.enter="search"
    />
		<!-- <div id="search-result" class="box"></div> -->
	</div>
</template>

<style scoped>
.search-container {
  position: fixed;
  left: 322px;
  display: flex;
  align-items: center;
  width: 300px;
	height: 32px;
  padding-left: 5px;
	transition: all 0.15s;
	border: 1px #ccc solid;
	border-radius: 15px;
}
.search-icon {
  margin: 0;
  padding: 0;
  border: none;
  outline: none;
  background: none;
  cursor: pointer;
}
.search-input {
  flex: 1;
  height: 100%;
	border-radius: 15px;
  border: none;
  outline: none
}
</style>
