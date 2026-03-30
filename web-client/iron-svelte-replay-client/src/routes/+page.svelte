<script lang="ts">
    import { ReplayPlayer } from '$lib/index.js';

    const testUrl =
        'http://localhost:8000/e215009e7cb9ca3d71613d5454d8bd1c_59ee4d0f4822541dd854bf4006b058363f1510fcd468d087ae27f32cca17a47a.bin';
</script>

<!-- Test 3 RETEST: Fixed width AND height -->
<!-- Expected: canvas contained within red border, no overflow below -->
<!-- <div style="width: 640px; height: 360px; border: 2px solid red;">
    <ReplayPlayer url={testUrl} />
</div> -->

<!-- Test 4 RETEST: Full viewport -->
<!-- Expected: player fills viewport, canvas centered -->
<!-- <div style="width: 100vw; height: 100vh; margin: 0; padding: 0;">
    <ReplayPlayer url={testUrl} />
</div> -->

<!-- Test 5 RETEST: Fixed size, press Play and let run a few seconds -->
<!-- Expected: canvas stays within red border while playing, no overflow -->
<div style="width: 640px; height: 360px; border: 2px solid red;">
    <ReplayPlayer url={testUrl} />
</div>
