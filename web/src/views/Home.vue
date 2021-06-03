<template>
  <div class="home">
    <van-nav-bar title="设备列表" />
    <van-list>
      <van-cell
        v-for="(iotpi, index) of iotpis"
        :title="iotpi.alias"
        :label="iotpi.devid"
        :key="index"
        is-link="true"
        center="true"
        @click="getIotpiDetail(iotpi)"
      >
        <template #icon>
          <van-image
            width="50"
            height="50"
            :src="require('../assets/img/iotpi.png')"
          />
        </template>
      </van-cell>
    </van-list>
  </div>
</template>

<script>
import axios from "axios";
import { getHeaders } from "../service/auth";

export default {
  name: "Home",
  data() {
    return {
      iotpis: [],
      connectErrorCount: 0,
      errorCount: 0,
    };
  },
  sockets: {
    connect() {
      this.getIotpiList();
      console.log("socket connected");
    },
    connectError() {
      this.connectErrorCount++;
      if (this.connectErrorCount > 3) {
        this.$notify({
          type: "danger",
          message: `连接错误！`,
        });
      }
      console.log("socket connect error");
    },
    connectTimeout() {
      console.log("socket connect timeout");
    },
    error() {
      this.errorCount++;
      if (this.errorCount > 3) {
        this.$notify({
          type: "danger",
          message: `发生错误！`,
        });
      }
      console.log("error");
    },
    disconnect() {
      console.log("socket disconnect");
    },
  },
  methods: {
    initSocket() {
      this.$socket.$subscribe("iotpi-lost", (devid) => {
        this.$notify({
          type: "primary",
          message: `${devid} 设备已下线`,
        });
        this.iotpis = this.iotpis.filter((iotpi) => {
          iotpi.devid !== devid;
        });
      });
      this.$socket.$subscribe("iotpi-join", (iotpi) => {
        this.$notify({
          type: "primary",
          message: `新上线了 ${iotpi.alias} 设备`,
        });
        this.iotpis.push(iotpi);
      });
      this.$socket.$subscribe("iotpi-error", (error) => {
        this.$notify({ type: "danger", message: error.error });
      });
    },
    getIotpiList() {
      this.$socket.client.emit("iotpi-list", (data) => {
        this.iotpis = data;
        console.log(this.iotpis);
      });
    },
    getIotpiDetail(iotpi) {
      axios
        .post(`/api/select/${iotpi.devid}`, {}, { headers: getHeaders() })
        .then(() => {
          this.$router.push({ name: "Details", params: iotpi });
        })
        .catch((error) => {
          if (error.status === 400) {
            this.$notify({ type: "danger", message: "参数错误！" });
          } else if (error.status === 503) {
            this.$notify({ type: "danger", message: error.error });
            console.log(error.error);
          } else if (error.status === 403) {
            this.$notify({ type: "danger", message: "无访问权限！" });
            console.log("无访问权限！");
          } else {
            this.$notify({ type: "danger", message: "未知错误！" });
            console.log("未知错误！");
          }
        });
    },
  },
  created() {
    this.initSocket();
  },
};
</script>
