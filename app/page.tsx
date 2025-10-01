import { Assistant } from "./assistant";
import { MyRuntimeProvider } from "@/app/MyRuntimeProvider";

export default function Home() {
  return (
    <MyRuntimeProvider>
      <Assistant />
    </MyRuntimeProvider>
  );
}
