/**
 * AI Agent 工具定义（OpenAI Function Calling 格式）
 * 共7个工具：get_categories, add_category, add_record,
 *           query_records, update_record, delete_record, get_statistics
 */
export const tools = [
  {
    type: "function",
    function: {
      name: "get_categories",
      description: "获取用户的所有收支分类列表，包含分类ID、名称和类型（income/expense）",
      parameters: { type: "object", properties: {}, required: [] }
    }
  },
  {
    type: "function",
    function: {
      name: "add_category",
      description: "添加新的收支分类",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "分类名称，如：餐饮、交通、工资、购物等" },
          type: { type: "string", enum: ["income", "expense"], description: "分类类型：income=收入，expense=支出" }
        },
        required: ["name", "type"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "add_record",
      description: "添加一条记账记录。调用前请确保分类存在且类型匹配。",
      parameters: {
        type: "object",
        properties: {
          category_id: { type: "integer", description: "分类ID（从get_categories获取）" },
          amount: { type: "number", description: "金额，单位：元，必须大于0" },
          type: { type: "string", enum: ["income", "expense"], description: "记录类型，必须与分类类型一致" },
          date: { type: "string", description: "日期，格式YYYY-MM-DD，默认今天" },
          remark: { type: "string", description: "备注信息，可选" }
        },
        required: ["category_id", "amount", "type", "date"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "query_records",
      description: "查询用户的记账记录，支持按日期范围、类型筛选，支持分页",
      parameters: {
        type: "object",
        properties: {
          start: { type: "string", description: "查询开始日期，格式YYYY-MM-DD，可选" },
          end: { type: "string", description: "查询结束日期，格式YYYY-MM-DD，可选" },
          type: { type: "string", enum: ["income", "expense"], description: "按类型筛选，可选" },
          page: { type: "integer", description: "页码，从1开始，默认1" },
          pageSize: { type: "integer", description: "每页条数，默认10，最大50" }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_record",
      description: "修改一条已有的记账记录，只需传入要修改的字段",
      parameters: {
        type: "object",
        properties: {
          id: { type: "integer", description: "要修改的记录ID" },
          category_id: { type: "integer", description: "新的分类ID" },
          amount: { type: "number", description: "新金额" },
          type: { type: "string", enum: ["income", "expense"], description: "新类型" },
          date: { type: "string", description: "新日期，格式YYYY-MM-DD" },
          remark: { type: "string", description: "新备注" }
        },
        required: ["id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "delete_record",
      description: "删除一条记账记录。此操作不可撤销，请确认后再执行。",
      parameters: {
        type: "object",
        properties: {
          id: { type: "integer", description: "要删除的记录ID" }
        },
        required: ["id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_statistics",
      description: "获取收支统计数据，支持日统计、月统计、近N天趋势统计",
      parameters: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["daily", "monthly", "trend"], description: "统计类型" },
          date: { type: "string", description: "日期YYYY-MM-DD（daily时必填）" },
          month: { type: "string", description: "月份YYYY-MM（monthly时必填）" },
          days: { type: "integer", description: "最近N天（trend时使用，默认7）" }
        },
        required: ["type"]
      }
    }
  }
];
