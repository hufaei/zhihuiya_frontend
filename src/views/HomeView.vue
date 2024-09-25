<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue'
import { generateToken, searchPatents } from '@/api/P002' 
const showModal = ref(true)
const clientId = ref('')
const secretKey = ref('')

// 请求体数据-前后端一致
const searchParams = ref({
  sort: [{ field: 'PBDT_YEARMONTHDAY', order: 'DESC' }],
  limit: 10,
  offset: 0,
  query_text: 'TACD: virtual reality ',
  collapse_by: 'PBD',
  collapse_type: 'DOCDB',
  collapse_order: 'LATEST'
})

const isLoading = ref(false)
const error = ref<{ error_msg: string; error_code: string } | null>(null)

interface SearchResult {
  data: {
    total_search_result_count: number;
    results: { patent_id: string; pn: string }[];
  };
}

const searchResult = ref<SearchResult | null>(null);

// 确认 Client 信息
const confirmClientInfo = async () => {
  if (clientId.value && secretKey.value) {
    console.log('Client ID:', clientId.value)
    console.log('Secret Key:', secretKey.value)
    showModal.value = false

    // 调用后端的 token 生成方法
    try {
      const tokenResponse = await generateToken(clientId.value, secretKey.value)
      // 解析响应中的 token
      const token = tokenResponse.data.token;

      // 将 clientId（即 apikey）和 token 存入 sessionStorage
      sessionStorage.setItem('apikey', clientId.value);
      sessionStorage.setItem('token', token);
    } catch (err) {
      error.value = {
        error_msg: '获取 token 失败，请检查 clientId 和 secretKey 是否正确。',
        error_code: 'TOKEN_ERROR'
      }
      console.error(err)
    }
  } else {
    alert('请输入完整的 Client ID 和 Secret Key')
  }
}

// 调用专利搜索 API
const searchPatentsAPI = async () => {
  console.log('搜索表单:', searchParams.value)
  isLoading.value = true
  error.value = null
  searchResult.value = null

  try {
    const result = await searchPatents(searchParams.value) // 调用后端 API 进行搜索
    searchResult.value = result
    console.log('搜索结果:', result)
  } catch (err) {
    error.value = {
      error_msg: '专利搜索失败，请稍后重试。',
      error_code: 'SEARCH_ERROR'
    }
    console.error(err)
  } finally {
    isLoading.value = false
  }
}

// 分页功能
const nextPage = () => {
  searchParams.value.offset += searchParams.value.limit;
  searchPatentsAPI();  // 重新发送请求
}
const prevPage = () => {
  if (searchParams.value.offset >= searchParams.value.limit) {
    searchParams.value.offset -= searchParams.value.limit;
    searchPatentsAPI();  
  }
}

// 页面卸载时清除 sessionStorage
onBeforeUnmount(() => {
  sessionStorage.clear();
});
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-6">
    <!-- Modal for ClientID and SecretKey -->
    <div v-if="showModal" class="modal-overlay">
      <div class="modal-content">
        <h2>输入验证信息</h2>
        <form @submit.prevent="confirmClientInfo">
          <div class="form-group">
            <label for="client-id">Client ID</label>
            <input v-model="clientId" type="text" id="client-id">
          </div>
          <div class="form-group">
            <label for="secret-key">Secret Key</label>
            <input v-model="secretKey" type="password" id="secret-key">
          </div>
          <button type="submit" class="submit-btn">确认</button>
        </form>
      </div>
    </div>

    <!-- Main content -->
    <div class="content-container">
      <!-- Search form -->
      <div class="search-form">
        <h2>搜索条件</h2>
        <form @submit.prevent="searchPatentsAPI">
          <div class="form-group">
            <label for="offset">Offset</label>
            <input v-model.number="searchParams.offset" type="number" id="offset">
          </div>
          <div class="form-group">
            <label for="sort-field">排序字段</label>
            <select v-model="searchParams.sort[0].field" id="sort-field">
              <option value="PBDT_YEARMONTHDAY">公开日</option>
              <option value="APD_YEARMONTHDAY">申请日</option>
              <option value="ISD">授权日</option>
              <option value="SCORE">相关性</option>
            </select>
          </div>
          <div class="form-group">
            <label for="sort-order">排序顺序</label>
            <select v-model="searchParams.sort[0].order" id="sort-order">
              <option value="DESC">降序</option>
              <option value="ASC">升序</option>
            </select>
          </div>
          <div class="form-group">
            <label for="collapse-order">折叠顺序</label>
            <select v-model="searchParams.collapse_order" id="collapse-order">
              <option value="OLDEST">最早</option>
              <option value="LATEST">最新</option>
            </select>
          </div>
          <div class="form-group">
            <label for="collapse-by">折叠依据</label>
            <select v-model="searchParams.collapse_by" id="collapse-by">
              <option value="APD">申请日</option>
              <option value="PBD">公开日</option>
              <option value="AUTHORITY">受理局</option>
              <option value="SCORE">相关性</option>
            </select>
          </div>
          <div class="form-group">
            <label for="collapse-type">折叠类型</label>
            <select v-model="searchParams.collapse_type" id="collapse-type">
              <option value="ALL">不去重</option>
              <option value="APNO">按申请号去重</option>
              <option value="DOCDB">按简单同族去重</option>
              <option value="INPADOC">按inpadoc同族去重</option>
              <option value="EXTEND">按patsnap同族去重</option>
            </select>
          </div>
          <div class="form-group">
            <label for="query-text">检索式</label>
            <textarea v-model="searchParams.query_text" id="query-text" rows="3" maxlength="1500"></textarea>
          </div>
          <div class="form-group">
            <label for="limit">每页结果数</label>
            <input v-model.number="searchParams.limit" type="number" id="limit" min="1" max="100">
          </div>
          <button type="submit" class="submit-btn">搜索</button>
        </form>
      </div>

      <!-- Search results -->
      <div class="search-results">
        <h2>搜索结果</h2>
        <div v-if="isLoading" class="loading">
          <div class="spinner"></div>
          <p>正在搜索...</p>
        </div>
        <div v-else-if="error" class="error-message">
          <p class="error-title">错误</p>
          <p>{{ error.error_msg }}</p>
          <p class="error-code">错误代码: {{ error.error_code }}</p>
        </div>
        <div v-else-if="searchResult">
          <p>总结果数: <span class="result-count">{{ searchResult.data.total_search_result_count }}</span></p>
          <table class="results-table">
            <thead>
              <tr>
                <th>#</th>
                <th>专利ID</th>
                <th>公开(公告)号</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(result, index) in searchResult.data.results" :key="result.patent_id">
                <td>{{ searchParams.offset + index + 1 }}</td>
                <td>{{ result.patent_id }}</td>
                <td>{{ result.pn }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="no-results">
          <p>暂未搜索</p>
          <p>请输入搜索条件并点击搜索按钮。</p>
        </div>

        <!-- Pagination controls -->
        <div class="pagination-controls">
          <button @click="prevPage" :disabled="searchParams.offset === 0">上一页</button>
          <button @click="nextPage">下一页</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container{
  display: flex;
  flex-direction: row;
}
/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 50;
}

.modal-content {
  background-color: white;
  padding: 2rem;
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
  width: 24rem;
  transition: transform 0.3s ease-in-out;
}

.modal-content h2 {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
  text-align: center;
  color: #333;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
}

.content-container {
  display: flex;
  gap: 60px;
  padding-left: 5%;
}

.search-form {
  width: 30%;
  border: solid 2px grey;
  padding: 20px;
}

.search-results {
  width: 60%;
  border: solid 2px grey;
  padding: 20px;
}

.results-table {
  width: 100%;
  border-collapse: collapse;
}

.results-table th, .results-table td {
  border: solid 1px #ddd;
  padding: 8px;
}

.results-table th {
  background-color: #f2f2f2;
}

.pagination-controls {
  margin-top: 20px;
  display: flex;
  justify-content: space-between;
}

.pagination-controls button {
  padding: 10px 20px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.pagination-controls button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.loading {
  text-align: center;
}

.no-results {
  text-align: center;
}

</style>
