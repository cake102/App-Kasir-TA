import type * as QuaggaType from "quagga";

declare module "quagga" {
  const Quagga: typeof QuaggaType;
  export default Quagga;
}
