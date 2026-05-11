-- CreateTable
CREATE TABLE "SavedShare" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shareId" TEXT NOT NULL,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedShare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SavedShare_userId_idx" ON "SavedShare"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedShare_userId_shareId_key" ON "SavedShare"("userId", "shareId");

-- AddForeignKey
ALTER TABLE "SavedShare" ADD CONSTRAINT "SavedShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedShare" ADD CONSTRAINT "SavedShare_shareId_fkey" FOREIGN KEY ("shareId") REFERENCES "DocumentShare"("id") ON DELETE CASCADE ON UPDATE CASCADE;
