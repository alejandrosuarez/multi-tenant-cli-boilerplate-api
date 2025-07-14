# Runbook for Image Processing with Sharp

## Reprocessing Images When Sharp Starts Succeeding

If the Sharp library begins to function again and you want to reprocess images that previously failed, you can follow these steps:

1. **Identify Failed Image Uploads**
   - Check your logs for entries labeled with `[Sharp-Fail]` or `[Upload-Fail]`.

2. **Create a Background Job**
   - Develop a background job or script to iterate over the images previously marked as fallback.

3. **Invoke the Image Reprocessing Function**
   - Use the existing `uploadImage` function to re-attempt processing and upload.

4. **Update Database with Success**
   - Modify the database records to reflect the new successfully processed image URLs.

## Script Example

Here's a pseudocode example of what the reprocessing might look like:

```javascript
const imagesToReprocess = getImagesMarkedAsFallback();

for (const image of imagesToReprocess) {
  const buffer = fetchImageBufferFromURL(image.url);
  const uploadResult = await imageService.uploadImage(buffer, image.originalName, image.entityId, image.tenantId, image.userId, image.mimetype);
  if (uploadResult.success) {
    updateImageRecordWithNewData(image.id, uploadResult.data);
  }
}
```

Make sure that this process is tested in a development environment before running in production.
