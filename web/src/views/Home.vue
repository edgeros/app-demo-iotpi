<template>
  <div class="home">
    <van-nav-bar title="设备列表" fixed="true" safe-area-inset-top />
    <van-pull-refresh
      style="min-height: 100vh; margin-top: 46px"
      v-model="isLoading"
      @refresh="onRefresh"
    >
      <van-list style="min-height: 100vh">
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
    </van-pull-refresh>
  </div>
</template>

<script>
import axios from "axios";
import { getHeaders } from "../service/auth";
import { edger } from "@edgeros/web-sdk";

export default {
  name: "Home",
  data() {
    return {
      iotpis: [],
      isLoading: false,
    };
  },
  sockets: {
    connect() {
      this.getIotpiList();
      console.log("socket connected");
    },
    connectError() {
      console.log("socket connect error");
    },
    connectTimeout() {
      console.log("socket connect timeout");
    },
    error() {
      console.log("error");
    },
    disconnect() {
      console.log("socket disconnect");
    },
  },
  methods: {
    onRefresh() {
      setTimeout(() => {
        this.isLoading = false;
        this.getIotpiList();
      }, 1000);
    },
    initSocket() {
      this.$socket.$subscribe("iotpi-lost", (devid) => {
        edger.notify.info(`${devid} 设备已下线`);
        this.iotpis = this.iotpis.filter((iotpi) => {
          iotpi.devid !== devid;
        });
      });
      this.$socket.$subscribe("iotpi-join", (iotpi) => {
        edger.notify.info(`新上线了 ${iotpi.alias} 设备`);
        this.iotpis.push(iotpi);
      });
      this.$socket.$subscribe("iotpi-error", (error) => {
        if (error.code === 50002) {
          edger.notify.error(`无效设备！`);
        } else {
          edger.notify.error(error.message);
        }
      });
    },
    getIotpiList() {
      this.$socket.client.emit("iotpi-list", (data) => {
        this.iotpis = data;
        if (this.iotpis.length === 0) {
          edger.notify.error(`未发现设备！`);
        }
      });
    },
    getIotpiDetail(iotpi) {
      axios
        .post(`/api/select/${iotpi.devid}`, {}, { headers: getHeaders() })
        .then((res) => {
          if (res.data.result) {
            this.$router.push({ name: "Details", params: iotpi });
          } else {
            if (res.data.code === 50004) {
              edger.notify.error(`您没有此设备权限！`);
            } else {
              edger.notify.error(`未知错误！`);
            }
          }
        })
        .catch((error) => {
          console.log(error);
        });
    },
  },
  created() {
    this.initSocket();
    this.getIotpiList();
  },
};
</script>
