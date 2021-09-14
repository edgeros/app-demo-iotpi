<template>
  <div>
    <van-nav-bar title="设备详情" left-arrow @click-left="goBack()" class="safe-area-top"/>
    <van-cell-group>
      <van-cell title="设备ID">
        <template #default>
          <span class="font-color">{{ iotpi.devid }}</span>
        </template>
      </van-cell>
      <van-cell title="设备名称">
        <template #default>
          <span class="font-color">{{ iotpi.alias }}</span>
        </template>
      </van-cell>
      <van-cell center title="led1">
        <template #right-icon>
          <van-switch @click="iotpiControl(1)" :value="iotpi.led1" size="24" />
        </template>
      </van-cell>
      <van-cell center title="led2">
        <template #right-icon>
          <van-switch @click="iotpiControl(2)" :value="iotpi.led2" size="24" />
        </template>
      </van-cell>
      <van-cell center title="led3">
        <template #right-icon>
          <van-switch @click="iotpiControl(3)" :value="iotpi.led3" size="24" />
        </template>
      </van-cell>
    </van-cell-group>
  </div>
</template>

<script>

export default {
  name: "Details",
  data() {
    return {
      iotpi: {
        devid: "",
        alias: "",
        led1: false,
        led2: false,
        led3: false,
      },
    };
  },
  methods: {
    goBack() {
      this.$router.push({name: 'Home'});
    },
    initSocket() {
      this.$socket.$subscribe("iotpi-message", (msg) => {
        if (typeof msg.led1 !== "undefined") {
          this.iotpi.led1 = msg.led1;
        }
        if (typeof msg.led2 !== "undefined") {
          this.iotpi.led2 = msg.led2;
        }
        if (typeof msg.led3 !== "undefined") {
          this.iotpi.led3 = msg.led3;
        }
      });
      this.$socket.$subscribe("iotpi-lost", (devid) => {
        if (devid === this.iotpi.devid) {
          this.goBack();
        }
      });
    },
    iotpiControl(type) {
      let msg = {};
      if (type === 1) {
        msg = { led1: !this.iotpi.led1 };
      } else if (type === 2) {
        msg = { led2: !this.iotpi.led2 };
      } else if (type === 3) {
        msg = { led3: !this.iotpi.led3 };
      } else {
        this.$notify({ type: "danger", message: "未知错误！" });
      }
      this.$socket.client.emit("iotpi-control", msg);
    },
  },
  created() {
    this.iotpi.devid = this.$route.params.devid;
    this.iotpi.alias = this.$route.params.alias;
    this.initSocket();
  },
};
</script>
<style scoped>
  .van-cell__title {
    text-align: left;
  }
  .font-color {
    color: #1989fa;
  }
</style>
