<script lang="ts">
    import { ReplayPlayer } from '$lib/index.js';

    // const testUrl =
    //     'http://localhost:8000/e215009e7cb9ca3d71613d5454d8bd1c_ec858aeb804d9c35d37568c15af45c51a20c9c91ae45e878eeb316a639a5d7a3.bin';
    // const testUrl =
    //     'http://localhost:8000/e215009e7cb9ca3d71613d5454d8bd1c_59ee4d0f4822541dd854bf4006b058363f1510fcd468d087ae27f32cca17a47a.bin';
    //
    const testUrl =
        'http://localhost:8000/e215009e7cb9ca3d71613d5454d8bd1c_cd4d55d9a92a83f0d66112d6252401c3f049f796136de5d9056b9ff3fb6ff441.bin';
</script>

<h1>Replay Player Test Client</h1>
<ReplayPlayer url={testUrl} />
